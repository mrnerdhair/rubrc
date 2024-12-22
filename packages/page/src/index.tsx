/* @refresh reload */
import "./index.css";
import { render } from "solid-js/web";

import App from "./App";
import { parser_setup } from "./cmd_parser";
import { gen_ctx } from "./ctx";
import type { MainWorker } from "./worker_process/worker";
import main_worker from "./worker_process/worker?worker";
import "./monaco_worker";
import * as Comlink from "comlink";
import { compile_and_run_setup } from "./compile_and_run";

const root = document.getElementById("root");

if (!(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const ctx = gen_ctx();

// create worker
const worker = Comlink.wrap<MainWorker>(new main_worker());

parser_setup(ctx);
compile_and_run_setup(ctx);

// send message to worker
worker({ ctx });

render(
  () => (
    <App
      ctx={ctx}
      callback={(wasi_ref) =>
        worker({
          wasi_ref,
        })
      }
    />
  ),
  root,
);
