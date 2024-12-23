/// <reference lib="webworker" />

import { sysroot } from "@oligami/rustc-browser-wasi_shim";
import get_default_sysroot_wasi_farm = sysroot.get_default_sysroot_wasi_farm;
import load_additional_sysroot = sysroot.load_additional_sysroot;
import type { WASIFarmRefUseArrayBufferObject } from "@oligami/browser_wasi_shim-threads";
import * as Comlink from "comlink";
import type { LlvmWorkerInit, LlvmWorker as LlvmWorkerType } from "./llvm";
import LlvmWorkerCtor from "./llvm?worker";
import type { RustcWorkerInit, RustcWorker as RustcWorkerType } from "./rustc";
import RustcWorkerCtor from "./rustc?worker";
import type {
  UtilCmdWorkerInit,
  UtilCmdWorker as UtilCmdWorkerType,
} from "./util_cmd";
import UtilCmdWorkerCtor from "./util_cmd?worker";

import { type Terminal, setTransferHandlers } from "rubrc-util";
import type { CompileAndRun } from "../compile_and_run";

const rustcWorkerInit = Comlink.wrap<RustcWorkerInit>(new RustcWorkerCtor());
const utilCmdWorkerInit = Comlink.wrap<UtilCmdWorkerInit>(
  new UtilCmdWorkerCtor(),
);
const llvmWorkerInit = Comlink.wrap<LlvmWorkerInit>(new LlvmWorkerCtor());

export class MainWorker {
  private readonly terminal: Terminal;
  private readonly rustc_worker: RustcWorkerType;
  private readonly util_worker: UtilCmdWorkerType;
  private readonly llvm_worker: LlvmWorkerType;

  protected constructor({
    terminal,
    rustc_worker,
    util_worker,
    llvm_worker,
  }: {
    terminal: Terminal;
    rustc_worker: RustcWorkerType;
    util_worker: UtilCmdWorkerType;
    llvm_worker: LlvmWorkerType;
  }) {
    this.terminal = terminal;
    this.rustc_worker = rustc_worker;
    this.util_worker = util_worker;
    this.llvm_worker = llvm_worker;
  }

  static async init(
    terminal: Terminal,
    terminal_wasi_ref: WASIFarmRefUseArrayBufferObject,
    compile_and_run: CompileAndRun,
  ) {
    terminal.write("loading sysroot\r\n");

    const farm = await get_default_sysroot_wasi_farm();

    terminal.write("loaded sysroot\r\n");

    const farm_wasi_ref = farm.get_ref();
    const wasi_refs = [farm_wasi_ref, terminal_wasi_ref];

    const [rustc_worker, llvm_worker, util_worker] = await Promise.all([
      rustcWorkerInit(Comlink.proxy(terminal), wasi_refs),
      llvmWorkerInit(wasi_refs),
      utilCmdWorkerInit(
        Comlink.proxy(terminal),
        Comlink.proxy(compile_and_run),
        wasi_refs,
      ),
    ]);

    return new MainWorker({ terminal, rustc_worker, util_worker, llvm_worker });
  }

  async load_additional_sysroot(triple: string) {
    this.terminal.write(`loading sysroot ${triple}\r\n`);
    await load_additional_sysroot(triple);
    this.terminal.write(`loaded sysroot ${triple}\r\n`);
  }

  async rustc(...args: string[]) {
    return await this.rustc_worker.rustc(...args);
  }

  async llvm(...args: string[]) {
    return await this.llvm_worker.llvm(...args);
  }

  async ls(...args: string[]) {
    return await this.util_worker.ls(...args);
  }

  async download(file: string) {
    return await this.util_worker.download(file);
  }

  async tree(...args: string[]) {
    return await this.util_worker.tree(...args);
  }

  async exec_file(...args: string[]) {
    return await this.util_worker.exec_file(...args);
  }
}

export type MainWorkerInit = typeof MainWorker.init;

setTransferHandlers();
Comlink.expose(MainWorker.init, self);
