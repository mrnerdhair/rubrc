import { SharedObjectRef } from "@oligami/shared-object";
import { get_default_sysroot_wasi_farm } from "../../lib/src/sysroot";
import type { Ctx } from "./ctx";

let terminal: (string) => void;
let rustc_worker: Worker;
let ctx: Ctx;
import RustcWorker from "./rustc?worker";

globalThis.addEventListener("message", async (event) => {
  if (event.data.ctx) {
    rustc_worker = new RustcWorker();
    ctx = event.data.ctx;
    rustc_worker.postMessage({ ctx });

    terminal = new SharedObjectRef(ctx.terminal_id).proxy<(string) => void>();

    await terminal("loading sysroot\r\n");

    const farm = await get_default_sysroot_wasi_farm();

    await terminal("loaded sysroot\r\n");

    const wasi_ref = farm.get_ref();

    rustc_worker.postMessage({ wasi_ref });
  } else if (event.data.wasi_ref) {
    const { wasi_ref } = event.data;

    rustc_worker.postMessage({ wasi_ref_ui: wasi_ref });
  }
});
