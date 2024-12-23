/// <reference lib="webworker" />

import { strace } from "@bjorn3/browser_wasi_shim";
import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { get_llvm_wasm } from "@oligami/rustc-browser-wasi_shim";
import * as Comlink from "comlink";
import {
  type WasiP1Cmd,
  as_wasi_p1_cmd,
  setTransferHandlers,
} from "rubrc-util";
import thread_spawn_worker_url from "./thread_spawn.ts?worker&url";

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

  static async init(wasi_refs: WASIFarmRefUseArrayBufferObject[]) {
    console.log("loading llvm");

    const linker_wasm = await get_llvm_wasm();

    console.log("linker_wasm", linker_wasm);

    const wasi = new WASIFarmAnimal(
      wasi_refs,
      ["llvm"], // args
      [], // env
      {
        // debug: true,
        can_thread_spawn: true,
        thread_spawn_worker_url,
        thread_spawn_wasm: linker_wasm,
      },
    );

    const linker = as_wasi_p1_cmd(
      await WebAssembly.instantiate(linker_wasm, {
        wasi_snapshot_preview1: strace(wasi.wasiImport, []),
      }),
    );

    const memory_reset = linker.exports.memory.buffer;
    const memory_reset_view = new Uint8Array(memory_reset).slice();

    console.log("llvm loaded");

    return new LlvmWorker({ wasi, linker, memory_reset_view });
  }
  async llvm(...args: string[]) {
    if (args[0] !== "llvm") {
      this.wasi.args = ["llvm", ...args];
    } else {
      this.wasi.args = args;
    }
    console.log(`wasi.start: ${this.wasi.args}`);
    console.log(this.wasi);
    const memory_view = new Uint8Array(this.linker.exports.memory.buffer);
    memory_view.set(this.memory_reset_view);
    this.wasi.start(this.linker);
    console.log("wasi.start done");
  }
}

export type LlvmWorkerInit = typeof LlvmWorker.init;

setTransferHandlers();
Comlink.expose(LlvmWorker.init, self);
