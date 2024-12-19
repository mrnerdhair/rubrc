import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import { WASIFarmAnimal } from "@oligami/browser_wasi_shim-threads";
import type { Ctx } from "../ctx";
import lsr from "../wasm/lsr.wasm?url";
import tre from "../wasm/tre.wasm?url";
import {
  get_data as base_get_data,
  type WASIFarmAnimal as LoosenedWASIFarmAnimal,
} from "../cat";
import type { WASIFarmRefObject } from "./rustc";

const shared: SharedObject[] = [];

const get_data = (path: string, animal: WASIFarmAnimal) =>
  base_get_data(
    path,
    ((x: WASIFarmAnimal): LoosenedWASIFarmAnimal =>
      x as unknown as LoosenedWASIFarmAnimal)(animal),
  );

globalThis.addEventListener("message", async (event) => {
  const {
    wasi_refs,
    ctx,
  }: {
    wasi_refs: WASIFarmRefObject[];
    ctx: Ctx;
  } = event.data;

  console.log("loading lsr and tre");

  const terminal = new SharedObjectRef(ctx.terminal_id).proxy<
    (x: string) => Promise<void>
  >();
  const waiter = new SharedObjectRef(ctx.waiter_id).proxy<{
    set_end_of_exec: (_end_of_exec: boolean) => Promise<void>;
  }>();
  const download_by_url = new SharedObjectRef(ctx.download_by_url_id).proxy<
    (url: string, name: string) => Promise<void>
  >();

  const ls_wasm = await WebAssembly.compile(
    await (await fetch(lsr)).arrayBuffer(),
  );

  const ls_wasi = new WASIFarmAnimal(
    wasi_refs,
    [], // args
    [], // env
  );

  const ls_inst = (await WebAssembly.instantiate(ls_wasm, {
    wasi_snapshot_preview1: ls_wasi.wasiImport,
  })) as unknown as {
    exports: { memory: WebAssembly.Memory; _start: () => unknown };
  };

  const ls_memory_reset = ls_inst.exports.memory.buffer;
  const ls_memory_reset_view = new Uint8Array(ls_memory_reset).slice();

  shared.push(
    new SharedObject((...args: string[]) => {
      // If I don't reset memory, I get some kind of error.
      const memory_view = new Uint8Array(ls_inst.exports.memory.buffer);
      memory_view.set(ls_memory_reset_view);
      ls_wasi.args = ["lsr", ...args];
      ls_wasi.start(ls_inst);
    }, ctx.ls_id),
  );

  const tree_wasm = await WebAssembly.compile(
    await (await fetch(tre)).arrayBuffer(),
  );

  const tree_wasi = new WASIFarmAnimal(
    wasi_refs,
    [], // args
    [], // env
  );

  const tree_inst = (await WebAssembly.instantiate(tree_wasm, {
    wasi_snapshot_preview1: tree_wasi.wasiImport,
  })) as unknown as {
    exports: { memory: WebAssembly.Memory; _start: () => unknown };
  };

  console.log("tree_inst", tree_inst);

  const tree_memory_reset = tree_inst.exports.memory.buffer;
  const tree_memory_reset_view = new Uint8Array(tree_memory_reset).slice();

  shared.push(
    new SharedObject((...args: string[]) => {
      // If I don't reset memory, I get some kind of error.
      tree_wasi.args = ["tre", ...args];
      const memory_view = new Uint8Array(tree_inst.exports.memory.buffer);
      memory_view.set(tree_memory_reset_view);
      tree_wasi.start(tree_inst);
    }, ctx.tree_id),
  );

  console.log("lsr_inst", ls_inst);

  console.log("lsr and tre loaded");

  const animal = new WASIFarmAnimal(
    wasi_refs,
    [], // args
    [], // env
  );

  shared.push(
    new SharedObject((...args: string[]) => {
      (async (args: string[]) => {
        const exec_file = args[0];
        const exec_args = args.slice(1);
        try {
          const file = get_data(exec_file, animal);
          const compiled_wasm = await WebAssembly.compile(file);
          const inst = (await WebAssembly.instantiate(compiled_wasm, {
            wasi_snapshot_preview1: animal.wasiImport,
          })) as unknown as {
            exports: { memory: WebAssembly.Memory; _start: () => unknown };
          };
          animal.args = [exec_file, ...exec_args];
          animal.start(inst);
        } catch (e) {
          terminal(`Error: ${e}\r\n`);
        }
        waiter.set_end_of_exec(true);
      })(args);
    }, ctx.exec_file_id),
  );

  shared.push(
    new SharedObject((file: string) => {
      (async (file) => {
        console.log("exec_file", file);
        try {
          const file_data = get_data(file, animal);
          const blob = new Blob([file_data]);
          const url = URL.createObjectURL(blob);
          const filename = file.split("/").pop();
          if (!filename) throw new Error("filename is blank");
          await download_by_url(url, filename);
          URL.revokeObjectURL(url);
        } catch (e) {
          terminal(`Error: ${e}\r\n`);
        }
        waiter.set_end_of_exec(true);
      })(file);
    }, ctx.download_id),
  );
});
