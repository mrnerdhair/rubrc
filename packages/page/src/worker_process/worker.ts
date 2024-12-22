/// <reference lib="webworker" />

import { sysroot } from "@oligami/rustc-browser-wasi_shim";
import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import get_default_sysroot_wasi_farm = sysroot.get_default_sysroot_wasi_farm;
import load_additional_sysroot = sysroot.load_additional_sysroot;
import type { WASIFarmRefUseArrayBufferObject } from "@oligami/browser_wasi_shim-threads";
import * as Comlink from "comlink";
import type { Ctx } from "../ctx";
import type { LlvmWorker } from "./llvm";
import run_llvm_worker from "./llvm?worker";
import type { RustcWorker } from "./rustc";
import rustc_worker_constructor from "./rustc?worker";
import type { UtilCmdWorker } from "./util_cmd";
import util_cmd_worker from "./util_cmd?worker";

let terminal: (x: string) => Promise<void>;
let rustc_worker: RustcWorker;
let ctx: Ctx;

const wasi_refs: WASIFarmRefUseArrayBufferObject[] = [];

export type MainWorker = (data: {
  wasi_ref?: WASIFarmRefUseArrayBufferObject;
  ctx?: Ctx;
}) => Promise<void>;

const main_worker: MainWorker = async (data) => {
  if (data.ctx) {
    rustc_worker = Comlink.wrap<RustcWorker>(new rustc_worker_constructor());
    ctx = data.ctx;
    rustc_worker({ ctx });

    terminal = new SharedObjectRef(ctx.terminal_id).proxy<
      (x: string) => Promise<void>
    >();

    await terminal("loading sysroot\r\n");

    const farm = await get_default_sysroot_wasi_farm();

    await terminal("loaded sysroot\r\n");

    const wasi_ref = farm.get_ref();

    rustc_worker({ wasi_ref });

    // shared load_additional_sysroot
    new SharedObject((triple: string) => {
      (async () => {
        terminal(`loading sysroot ${triple}\r\n`);
        await load_additional_sysroot(triple);
        terminal(`loaded sysroot ${triple}\r\n`);
      })();
    }, ctx.load_additional_sysroot_id);

    wasi_refs.push(wasi_ref);
    if (wasi_refs.length === 2) {
      setup_util_worker(wasi_refs, ctx);
    }
  } else if (data.wasi_ref) {
    const { wasi_ref } = data;

    rustc_worker({ wasi_ref_ui: wasi_ref });
    wasi_refs.push(wasi_ref);
    if (wasi_refs.length === 2) {
      setup_util_worker(wasi_refs, ctx);
    }
  }
};

Comlink.expose(main_worker, self);

const setup_util_worker = (
  wasi_refs: WASIFarmRefUseArrayBufferObject[],
  ctx: Ctx,
) => {
  const util_worker = Comlink.wrap<UtilCmdWorker>(new util_cmd_worker());
  const llvm_worker = Comlink.wrap<LlvmWorker>(new run_llvm_worker());

  util_worker({
    wasi_refs,
    ctx,
  });

  llvm_worker({
    wasi_refs,
    ctx,
  });
};
