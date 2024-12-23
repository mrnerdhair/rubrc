/// <reference lib="webworker" />

import {
  WASIFarmAnimal,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import * as Comlink from "comlink";
import {
  type Terminal,
  type WasiP1Cmd,
  as_wasi_p1_cmd,
  setTransferHandlers,
} from "rubrc-util";
import { get_data } from "../cat";
import type { CompileAndRun } from "../compile_and_run";
import lsr from "../wasm/lsr.wasm?url";
import tre from "../wasm/tre.wasm?url";

export class UtilCmdWorker {
  private readonly ls_memory_reset_view: Uint8Array;
  private readonly ls_wasi: WASIFarmAnimal;
  private readonly ls_inst: WasiP1Cmd;

  private readonly tree_memory_reset_view: Uint8Array;
  private readonly tree_wasi: WASIFarmAnimal;
  private readonly tree_inst: WasiP1Cmd;

  private readonly terminal: Terminal;
  private readonly animal: WASIFarmAnimal;
  private readonly compile_and_run: CompileAndRun;

  protected constructor({
    ls_memory_reset_view,
    ls_wasi,
    ls_inst,
    tree_memory_reset_view,
    tree_wasi,
    tree_inst,
    terminal,
    animal,
    compile_and_run,
  }: {
    ls_memory_reset_view: Uint8Array;
    ls_wasi: WASIFarmAnimal;
    ls_inst: WasiP1Cmd;
    tree_memory_reset_view: Uint8Array;
    tree_wasi: WASIFarmAnimal;
    tree_inst: WasiP1Cmd;
    terminal: Terminal;
    animal: WASIFarmAnimal;
    compile_and_run: CompileAndRun;
  }) {
    this.ls_memory_reset_view = ls_memory_reset_view;
    this.ls_wasi = ls_wasi;
    this.ls_inst = ls_inst;
    this.tree_memory_reset_view = tree_memory_reset_view;
    this.tree_wasi = tree_wasi;
    this.tree_inst = tree_inst;
    this.terminal = terminal;
    this.animal = animal;
    this.compile_and_run = compile_and_run;
  }

  static async init(
    terminal: Terminal,
    compile_and_run: CompileAndRun,
    wasi_refs: WASIFarmRefUseArrayBufferObject[],
  ): Promise<UtilCmdWorker> {
    console.log("loading lsr and tre");

    const ls_wasm = await WebAssembly.compile(
      await (await fetch(lsr)).arrayBuffer(),
    );

    const ls_wasi = new WASIFarmAnimal(
      wasi_refs,
      [], // args
      [], // env
    );

    const ls_inst = as_wasi_p1_cmd(
      await WebAssembly.instantiate(ls_wasm, {
        wasi_snapshot_preview1: ls_wasi.wasiImport,
      }),
    );

    const ls_memory_reset = ls_inst.exports.memory.buffer;
    const ls_memory_reset_view = new Uint8Array(ls_memory_reset).slice();

    const tree_wasm = await WebAssembly.compile(
      await (await fetch(tre)).arrayBuffer(),
    );

    const tree_wasi = new WASIFarmAnimal(
      wasi_refs,
      [], // args
      [], // env
    );

    const tree_inst = as_wasi_p1_cmd(
      await WebAssembly.instantiate(tree_wasm, {
        wasi_snapshot_preview1: tree_wasi.wasiImport,
      }),
    );

    console.log("tree_inst", tree_inst);

    const tree_memory_reset = tree_inst.exports.memory.buffer;
    const tree_memory_reset_view = new Uint8Array(tree_memory_reset).slice();

    console.log("lsr_inst", ls_inst);

    console.log("lsr and tre loaded");

    const animal = new WASIFarmAnimal(
      wasi_refs,
      [], // args
      [], // env
    );

    return new UtilCmdWorker({
      ls_memory_reset_view,
      ls_wasi,
      ls_inst,
      tree_memory_reset_view,
      tree_wasi,
      tree_inst,
      terminal,
      animal,
      compile_and_run,
    });
  }

  async ls(...args: string[]) {
    // If I don't reset memory, I get some kind of error.
    const memory_view = new Uint8Array(this.ls_inst.exports.memory.buffer);
    memory_view.set(this.ls_memory_reset_view);
    this.ls_wasi.args = ["lsr", ...args];
    this.ls_wasi.start(this.ls_inst);
  }

  async tree(...args: string[]) {
    // If I don't reset memory, I get some kind of error.
    this.tree_wasi.args = ["tre", ...args];
    const memory_view = new Uint8Array(this.tree_inst.exports.memory.buffer);
    memory_view.set(this.tree_memory_reset_view);
    this.tree_wasi.start(this.tree_inst);
  }

  async exec_file(...args: string[]) {
    const exec_file = args[0];
    const exec_args = args.slice(1);
    try {
      const file = get_data(exec_file, this.animal);
      const compiled_wasm = await WebAssembly.compile(file);
      const inst = as_wasi_p1_cmd(
        await WebAssembly.instantiate(compiled_wasm, {
          wasi_snapshot_preview1: this.animal.wasiImport,
        }),
      );
      this.animal.args = [exec_file, ...exec_args];
      this.animal.start(inst);
    } catch (e) {
      this.terminal.write(`Error: ${e}\r\n`);
    }
  }

  async download(file: string) {
    try {
      const file_data = get_data(file, this.animal);
      const blob = new Blob([file_data]);
      const url = URL.createObjectURL(blob);
      const filename = file.split("/").pop();
      if (!filename) throw new Error("filename is blank");
      await this.compile_and_run.download_by_url(url, filename);
      URL.revokeObjectURL(url);
    } catch (e) {
      this.terminal.write(`Error: ${e}\r\n`);
    }
  }
}

export type UtilCmdWorkerInit = typeof UtilCmdWorker.init;

setTransferHandlers();
Comlink.expose(UtilCmdWorker.init, self);
