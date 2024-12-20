import { strace } from "@bjorn3/browser_wasi_shim";
import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_llvm_wasm } from "@oligami/rustc-browser-wasi_shim";
import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import { as_wasi_p1_cmd } from "rubrc-util";
import type { Ctx } from "../ctx";

const shared: SharedObject[] = [];

globalThis.addEventListener("message", async (event) => {
  const {
    wasi_refs,
    ctx,
  }: {
    wasi_refs: WASIFarmRefUseArrayBufferObject[];
    ctx: Ctx;
  } = event.data;

  const waiter = new SharedObjectRef(ctx.waiter_id).proxy<{
    is_rustc_fetch_end: () => Promise<boolean>;
  }>();

  while (!(await waiter.is_rustc_fetch_end())) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("loading llvm");

  await ready_llvm_wasm(wasi_refs, ctx);
});

let linker: WebAssembly.Instance & {
  exports: { memory: WebAssembly.Memory; _start: () => unknown };
};
let wasi: WASIFarmAnimal;

const ready_llvm_wasm = async (
  wasi_refs: WASIFarmRefUseArrayBufferObject[],
  ctx: Ctx,
) => {
  const linker_wasm = await get_llvm_wasm();

  console.log("linker_wasm", linker_wasm);

  wasi = new WASIFarmAnimal(
    wasi_refs,
    ["llvm"], // args
    [], // env
    // {
    // debug: true,
    // can_thread_spawn: true,
    // thread_spawn_worker_url: new URL(thread_spawn_path, import.meta.url)
    //   .href,
    // thread_spawn_wasm: linker,
    // },
  );

  linker = as_wasi_p1_cmd(
    await WebAssembly.instantiate(linker_wasm, {
      wasi_snapshot_preview1: strace(wasi.wasiImport, []),
    }),
  );

  const memory_reset = linker.exports.memory.buffer;
  const memory_reset_view = new Uint8Array(memory_reset).slice();

  shared.push(
    new SharedObject((...args: string[]) => {
      try {
        if (args[0] !== "llvm") {
          wasi.args = ["llvm", ...args];
        } else {
          wasi.args = args;
        }
        console.log(`wasi.start: ${wasi.args}`);
        console.log(wasi);
        const memory_view = new Uint8Array(linker.exports.memory.buffer);
        memory_view.set(memory_reset_view);
        wasi.start(linker);
        console.log("wasi.start done");
      } catch (e) {
        console.error(e);
      }
    }, ctx.llvm_id),
  );

  console.log("llvm loaded");
};
