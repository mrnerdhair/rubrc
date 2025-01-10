/// <reference lib="webworker" />

import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_llvm_wasm } from "@oligami/rustc-browser-wasi_shim";
import * as Comlink from "comlink";
import { type WasiP1Cmd, setTransferHandlers } from "rubrc-util";

export class LlvmWorker {
  private readonly wasi: WASIFarmAnimal;
  private readonly linker: WasiP1Cmd;
  private readonly memory_reset_view: Uint8Array;

  protected constructor({
    wasi,
    linker,
    memory_reset_view,
  }: {
    wasi: WASIFarmAnimal;
    linker: WasiP1Cmd;
    memory_reset_view: Uint8Array;
  }) {
    this.wasi = wasi;
    this.linker = linker;
    this.memory_reset_view = memory_reset_view;
  }

  static async init(
    wasi_refs: WASIFarmRefUseArrayBufferObject[],
  ): Promise<LlvmWorker> {
    console.log("loading llvm");

    const linker_wasm = await get_llvm_wasm();

    console.log("linker_wasm", linker_wasm);

    const wasi = await WASIFarmAnimal.init(
      wasi_refs,
      ["llvm"], // args
      [], // env
      {
        // debug: true,
        can_thread_spawn: true,
        thread_spawn_wasm: linker_wasm,
      },
    );

    const linker = await wasi.instantiate_cmd(linker_wasm, true);
    const memory_reset = linker.exports.memory.buffer;
    const memory_reset_view = new Uint8Array(memory_reset).slice();

    console.log("llvm loaded");

    return new LlvmWorker({ wasi, linker, memory_reset_view });
  }
  async llvm(...args: string[]): Promise<number> {
    if (args[0] !== "llvm") {
      this.wasi.args = ["llvm", ...args];
    } else {
      this.wasi.args = args;
    }
    console.log(`wasi.start: ${this.wasi.args}`);
    console.log(this.wasi);
    const memory_view = new Uint8Array(this.linker.exports.memory.buffer);
    memory_view.set(this.memory_reset_view);
    const code = await this.wasi.start(this.linker);
    console.log("wasi.start done", code);
    return code;
  }
}

export type LlvmWorkerInit = typeof LlvmWorker.init;

setTransferHandlers();
Comlink.expose(LlvmWorker.init, self);
