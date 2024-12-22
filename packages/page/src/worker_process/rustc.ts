/// <reference lib="webworker" />

import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_rustc_wasm } from "@oligami/rustc-browser-wasi_shim";
import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import * as Comlink from "comlink";
import type { Ctx } from "../ctx";
import thread_spawn_path from "./thread_spawn.ts?worker&url";

let terminal: (x: string) => void;
let compiler: WebAssembly.Module;
const wasi_refs: WASIFarmRefUseArrayBufferObject[] = [];
let ctx: Ctx;
let waiter: {
  rustc: () => Promise<void>;
  end_rustc_fetch: () => Promise<void>;
};

export type RustcWorker = (data: {
  ctx?: Ctx;
  wasi_ref?: WASIFarmRefUseArrayBufferObject;
  wasi_ref_ui?: WASIFarmRefUseArrayBufferObject;
}) => Promise<void>;

const rustc_worker: RustcWorker = async (data) => {
  if (data.ctx) {
    ctx = data.ctx;
    terminal = new SharedObjectRef(ctx.terminal_id).proxy<
      (x: string) => Promise<void>
    >();
    await terminal("loading rustc\r\n");
    waiter = new SharedObjectRef(ctx.waiter_id).proxy<{
      rustc: () => Promise<void>;
      end_rustc_fetch: () => Promise<void>;
    }>();
    compiler = await get_rustc_wasm();

    await waiter.end_rustc_fetch();
  } else if (data.wasi_ref) {
    const { wasi_ref } = data;

    wasi_refs.push(wasi_ref);

    // wait for the compiler to load
    while (!compiler) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await terminal("loaded rustc\r\n");

    while (wasi_refs.length === 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await terminal("loaded wasi\r\n");

    const wasi = new WASIFarmAnimal(
      wasi_refs,
      [], // args
      ["RUST_MIN_STACK=16777216"], // env
      {
        // debug: true,
        can_thread_spawn: true,
        thread_spawn_worker_url: new URL(thread_spawn_path, import.meta.url)
          .href,
        thread_spawn_wasm: compiler,
      },
    );

    await wasi.wait_worker_background_worker();

    wasi.get_share_memory().grow(200);

    // rustc_shared
    new SharedObject((...args: string[]) => {
      try {
        wasi.args = ["rustc", ...args];
        console.log("wasi.start");
        wasi.block_start_on_thread();
        console.log("wasi.start done");
      } catch (e) {
        terminal(`${e}\r\n`);
      }
    }, ctx.rustc_id);

    waiter.rustc();
  } else if (data.wasi_ref_ui) {
    wasi_refs.push(data.wasi_ref_ui);
  }
};

Comlink.expose(rustc_worker, self);
