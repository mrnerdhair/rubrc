/// <reference lib="webworker" />

import { thread_spawn_on_worker } from "@oligami/browser_wasi_shim-threads";
import * as Comlink from "comlink";
import { setTransferHandlers } from "rubrc-util";

export class ThreadSpawnWorker {
  protected constructor() {}

  static async init() {
    return new ThreadSpawnWorker();
  }
  async thread_spawn_on_worker(msg: Parameters<typeof thread_spawn_on_worker>[0]) {
    await thread_spawn_on_worker(msg);
  }
}

export type ThreadSpawnWorkerInit = typeof ThreadSpawnWorker.init;

setTransferHandlers();
Comlink.expose(ThreadSpawnWorker.init, self);
