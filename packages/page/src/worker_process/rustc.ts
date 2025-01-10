/// <reference lib="webworker" />

import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_rustc_wasm } from "@oligami/rustc-browser-wasi_shim";
import * as Comlink from "comlink";
import { type Terminal, setTransferHandlers } from "rubrc-util";

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
    wasi_farm_refs: WASIFarmRefUseArrayBufferObject[],
  ): Promise<RustcWorker> {
    terminal.write("loading rustc\r\n");
    const compiler = await get_rustc_wasm();

    terminal.write("loaded rustc\r\n");

    const wasi = await WASIFarmAnimal.init({
      wasi_farm_refs,
      args: [],
      env: ["RUST_MIN_STACK=16777216"],
      // debug: true,
      can_thread_spawn: true,
      module: compiler,
    });

    terminal.write("loaded wasi\r\n");

    wasi.grow_share_memory(200);

    return new RustcWorker({ terminal, wasi });
  }

  async rustc(...args: string[]): Promise<number> {
    try {
      this.wasi.args = ["rustc", ...args];
      console.log("wasi.start");
      const code = await this.wasi.async_start_on_thread();
      console.log("wasi.start done", code);
      return code;
    } catch (e) {
      this.terminal.write(`${e}\r\n`);
      throw e;
    }
  }
}

export type RustcWorkerInit = typeof RustcWorker.init;

setTransferHandlers();
Comlink.expose(RustcWorker.init, self);
