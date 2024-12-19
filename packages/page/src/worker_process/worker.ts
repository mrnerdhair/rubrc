import { sysroot } from "@oligami/rustc-browser-wasi_shim";
import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import get_default_sysroot_wasi_farm = sysroot.get_default_sysroot_wasi_farm;
import load_additional_sysroot = sysroot.load_additional_sysroot;
import type { Ctx } from "../ctx";
import type { WASIFarmRefObject } from "./rustc";

let terminal: (x: string) => Promise<void>;
let rustc_worker: Worker;
let ctx: Ctx;
import RustcWorker from "./rustc?worker";

const wasi_refs: WASIFarmRefObject[] = [];

globalThis.addEventListener("message", async (event) => {
  if (event.data.ctx) {
    rustc_worker = new RustcWorker();
    ctx = event.data.ctx;
    rustc_worker.postMessage({ ctx });

    terminal = new SharedObjectRef(ctx.terminal_id).proxy<
      (x: string) => Promise<void>
    >();

    await terminal("loading sysroot\r\n");

    const farm = await get_default_sysroot_wasi_farm();

    await terminal("loaded sysroot\r\n");

    const wasi_ref = farm.get_ref();

    rustc_worker.postMessage({ wasi_ref });

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
  } else if (event.data.wasi_ref) {
    const { wasi_ref } = event.data;

    rustc_worker.postMessage({ wasi_ref_ui: wasi_ref });
    wasi_refs.push(wasi_ref);
    if (wasi_refs.length === 2) {
      setup_util_worker(wasi_refs, ctx);
    }
  }
});

import run_llvm_worker from "./llvm?worker";
import util_cmd_worker from "./util_cmd?worker";

const setup_util_worker = (wasi_refs: WASIFarmRefObject[], ctx: Ctx) => {
  const util_worker = new util_cmd_worker();
  const llvm_worker = new run_llvm_worker();

  util_worker.postMessage({
    wasi_refs,
    ctx,
  });

  llvm_worker.postMessage({
    wasi_refs,
    ctx,
  });
};
