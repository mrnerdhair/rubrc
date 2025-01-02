/// <reference lib="webworker" />

import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_rustc_wasm } from "@oligami/rustc-browser-wasi_shim";
import * as Comlink from "comlink";
import { type Terminal, setTransferHandlers } from "rubrc-util";
import thread_spawn_worker_url from "./thread_spawn.ts?worker&url";

export class RustcWorker {
  private readonly terminal: Terminal;
  private readonly wasi: WASIFarmAnimal;

  protected constructor({
    terminal,
    wasi,
  }: { terminal: Terminal; wasi: WASIFarmAnimal }) {
    this.terminal = terminal;
    this.wasi = wasi;
  }

  static async init(
    terminal: Terminal,
    wasi_refs: WASIFarmRefUseArrayBufferObject[],
  ): Promise<RustcWorker> {
    terminal.write("loading rustc\r\n");
    const compiler = await get_rustc_wasm();

    terminal.write("loaded rustc\r\n");

    const wasi = await WASIFarmAnimal.init(
      wasi_refs,
      [], // args
      ["RUST_MIN_STACK=16777216"], // env
      {
        // debug: true,
        can_thread_spawn: true,
        thread_spawn_worker_url,
        thread_spawn_wasm: compiler,
      },
    );

    terminal.write("loaded wasi\r\n");

    wasi.grow_share_memory(200);

    return new RustcWorker({ terminal, wasi });
  }

  async rustc(...args: string[]) {
    try {
      this.wasi.args = ["rustc", ...args];
      console.log("wasi.start");
      this.wasi.block_start_on_thread();
      console.log("wasi.start done");
    } catch (e) {
      this.terminal.write(`${e}\r\n`);
    }
  }
}

export type RustcWorkerInit = typeof RustcWorker.init;

setTransferHandlers();
Comlink.expose(RustcWorker.init, self);
