/* @refresh reload */
import "./index.css";
import { render } from "solid-js/web";

import App from "./App";
import { parser_setup } from "./cmd_parser";
import type {
  MainWorkerInit,
  MainWorker as MainWorkerType,
} from "./worker_process/worker";
import MainWorkerCtor from "./worker_process/worker?worker";
import "./monaco_worker";
import type { WASIFarmRefUseArrayBuffer } from "@oligami/browser_wasi_shim-threads";
import * as Comlink from "comlink";
import { wrappedWorkerInit } from "rubrc-util";
import { CompileAndRun } from "./compile_and_run";
import type { CmdParser, Terminal } from "./util";

const root = document.getElementById("root");

if (!(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const mainWorkerInit = wrappedWorkerInit<MainWorkerInit>(MainWorkerCtor);

const { promise: main_worker_promise, resolve: set_main_worker } =
  Promise.withResolvers<MainWorkerType>();
const { promise: cmd_parser_promise, resolve: set_cmd_parser } =
  Promise.withResolvers<CmdParser>();
const { promise: terminal_promise, resolve: set_terminal } =
  Promise.withResolvers<Terminal>();
const { promise: terminal_wasi_ref_promise, resolve: set_terminal_wasi_ref } =
  Promise.withResolvers<WASIFarmRefUseArrayBuffer>();
const { promise: compile_and_run_promise, resolve: set_compile_and_run } =
  Promise.withResolvers<CompileAndRun>();

render(
  () => (
    <App
      cmd_parser={async (...args: string[]) => {
        return await (await cmd_parser_promise)(...args);
      }}
      compile_and_run={compile_and_run_promise}
      load_additional_sysroot_callback={async (value: string) => {
        return await (await main_worker_promise).load_additional_sysroot(value);
      }}
      terminal_callback={set_terminal}
      terminal_wasi_ref_callback={set_terminal_wasi_ref}
    />
  ),
  root,
);

const [terminal, terminal_wasi_ref] = await Promise.all([
  terminal_promise,
  terminal_wasi_ref_promise,
]);

const cmd_parser = parser_setup(terminal, main_worker_promise);
set_cmd_parser(cmd_parser);

const compile_and_run = new CompileAndRun(cmd_parser, terminal);
set_compile_and_run(compile_and_run);

const main_worker = await mainWorkerInit(
  Comlink.proxy(terminal),
  terminal_wasi_ref,
  Comlink.proxy(compile_and_run),
);
set_main_worker(main_worker);

terminal.write("rustc -h\r\n");
await main_worker.rustc("-h");
terminal.write(">");
