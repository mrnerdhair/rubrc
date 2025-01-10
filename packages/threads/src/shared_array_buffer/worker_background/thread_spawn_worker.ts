/// <reference lib="webworker" />

import * as Comlink from "comlink";
import { setTransferHandlers } from "rubrc-util";
import { WASIFarmAnimal } from "../../animals";
import { ThreadSpawner, type ThreadSpawnerObject } from "../thread_spawn";
import type { WorkerBackgroundRefObject } from "./worker_export";

// send fd_map is not implemented yet.
// issue: the fd passed to the child process is different from the parent process.

export class ThreadSpawnWorker {
  protected readonly wasi: WASIFarmAnimal;
  protected readonly module: WebAssembly.Module;

  protected constructor({
    wasi,
    module,
  }: { wasi: WASIFarmAnimal; module: WebAssembly.Module }) {
    this.wasi = wasi;
    this.module = module;
  }

  static async init({
    worker_background_ref,
    sl_object,
    module,
    args,
    env,
    fd_map,
  }: {
    worker_background_ref: WorkerBackgroundRefObject;
    sl_object: ThreadSpawnerObject;
    module: WebAssembly.Module;
    args: Array<string>;
    env: Array<string>;
    fd_map: Array<[number, number] | undefined>;
  }): Promise<ThreadSpawnWorker> {
    const override_fd_map = Array.from<[number, number][]>(
      ((x) => ({
        ...x,
        length: Object.keys(x).length,
      }))(
        Object.groupBy(
          fd_map.filter((x) => !!x),
          ([_fd, wasi_ref_n]) => wasi_ref_n,
        ),
      ),
    ).map((x) => x.map(([fd, _wasi_ref_n]) => fd));

    const thread_spawner = await ThreadSpawner.init({
      ...sl_object,
      worker_background_ref_object: worker_background_ref,
    });

    return new ThreadSpawnWorker({
      wasi: await WASIFarmAnimal.init(
        sl_object.wasi_farm_refs_object,
        args,
        env,
        {
          can_thread_spawn: true,
        },
        override_fd_map,
        thread_spawner,
      ),
      module,
    });
  }

  async start(readyResolver?: () => void): Promise<number> {
    const instance = await this.wasi.instantiate_cmd(this.module);
    readyResolver?.();
    return await this.wasi.start(instance);
  }

  async thread_start(
    thread_id: number,
    start_arg: number,
    readyResolver?: () => void,
  ) {
    console.log(`thread_spawn worker ${thread_id} start`);

    const instance = await this.wasi.instantiate_thread(this.module);
    readyResolver?.();
    return await this.wasi.wasi_thread_start(instance, thread_id, start_arg);
  }
}

export type ThreadSpawnWorkerInit = typeof ThreadSpawnWorker.init;

setTransferHandlers();
Comlink.expose(ThreadSpawnWorker.init, self);
