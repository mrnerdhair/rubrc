//  (export "wasi_thread_start" (func $61879))
//  (func $61879 (param $0 i32) (param $1 i32)
//   (local $2 i32)
//   (local $3 i32)
//   (local $4 i32)
//   (local $5 i32)
//   (local $6 i32)
//   (local $7 i32)
//   (global.set $global$0
//    (i32.load
//     (local.get $1)
//    )
//   )

//  (import "wasi" "thread-spawn" (func $fimport$27 (param i32) (result i32)))

import * as Comlink from "comlink";
import { setTransferHandlers } from "rubrc-util";
import { WASIFarmAnimal } from "../animals";
import type { WASIFarmRefUseArrayBufferObject } from "./ref";
import type { WorkerBackgroundRefObject } from "./worker_background/index";
import { WorkerBackgroundRef } from "./worker_background/index";
import type {
  WorkerBackground,
  WorkerBackgroundInit,
} from "./worker_background/worker";
import WorkerBackgroundCtor from "./worker_background/worker?worker";
import { WorkerBackgroundRefObjectConstructor } from "./worker_background/worker_export";

setTransferHandlers();

export type ThreadSpawnerObject = {
  share_memory?: WebAssembly.Memory;
  wasi_farm_refs_object: Array<WASIFarmRefUseArrayBufferObject>;
  worker_url: string;
  MIN_STACK?: number;
  worker_background_ref_object?: WorkerBackgroundRefObject;
  thread_spawn_wasm?: WebAssembly.Module;
  // inst_default_buffer_kept: WebAssembly.Memory;
};

export class ThreadSpawner {
  private share_memory: WebAssembly.Memory;
  private worker_url: string;
  private worker_background_ref: WorkerBackgroundRef;
  // inst_default_buffer_kept: WebAssembly.Memory;

  // hold the worker to prevent GC.
  private worker_background_worker?: WorkerBackground;

  // https://github.com/rustwasm/wasm-pack/issues/479

  static async init({
    worker_url,
    wasi_farm_refs_object,
    share_memory,
    MIN_STACK,
    worker_background_ref_object,
    thread_spawn_wasm,
    // inst_default_buffer_kept,
  }: ThreadSpawnerObject): Promise<ThreadSpawner> {
    // 16MB for the time being.
    // https://users.rust-lang.org/t/what-is-the-size-limit-of-threads-stack-in-rust/11867/3
    MIN_STACK ??= 16777216;
    const worker_background_worker_init = worker_background_ref_object
      ? undefined
      : Comlink.wrap<WorkerBackgroundInit>(new WorkerBackgroundCtor());
    worker_background_ref_object ??= WorkerBackgroundRefObjectConstructor();
    const worker_background_ref = await WorkerBackgroundRef.init(
      worker_background_ref_object,
    );

    const min_initial_size = 1048576 / 65536; // Rust's default stack size is 1MB.
    const initial_size = MIN_STACK / 65536;
    if (initial_size < min_initial_size) {
      throw new Error(
        `The stack size must be at least ${min_initial_size} bytes.`,
      );
    }
    const max_memory = 1073741824 / 65536; // Rust's default maximum memory size is 1GB.

    // const inst_default_buffer_kept =
    //   inst_default_buffer_kept ??
    //   new WebAssembly.Memory({
    //     initial: 1,
    //     maximum: max_memory,
    //     shared: true,
    //   });

    // WebAssembly.Memory's 1 page is 65536 bytes.
    share_memory ??= new WebAssembly.Memory({
      initial: initial_size,
      maximum: max_memory,
      shared: true,
    });

    return new ThreadSpawner({
      worker_url,
      share_memory,
      // inst_default_buffer_kept,
      worker_background_worker: await worker_background_worker_init?.(
        {
          sl_object: {
            share_memory,
            wasi_farm_refs_object,
            worker_url,
            worker_background_ref_object,
            // inst_default_buffer_kept,
          },
          thread_spawn_wasm,
        },
        worker_background_ref_object,
      ),
      worker_background_ref,
    });
  }

  protected constructor({
    worker_url,
    share_memory,
    // inst_default_buffer_kept,
    worker_background_worker,
    worker_background_ref,
  }: {
    worker_url: string;
    share_memory: WebAssembly.Memory;
    // inst_default_buffer_kept: WebAssembly.Memory,
    worker_background_worker: WorkerBackground | undefined;
    worker_background_ref: WorkerBackgroundRef;
  }) {
    this.worker_url = worker_url;

    this.share_memory = share_memory;
    // this.inst_default_buffer_kept = inst_default_buffer_kept;
    this.worker_background_worker = worker_background_worker;
    this.worker_background_ref = worker_background_ref;
  }

  thread_spawn(
    start_arg: number,
    args: Array<string>,
    env: Array<string>,
    fd_map: Array<[number, number] | undefined>,
  ): number {
    const worker = this.worker_background_ref.new_worker(
      this.worker_url,
      { type: "module" },
      {
        this_is_thread_spawn: true,
        start_arg,
        args,
        env,
        fd_map,
      },
    );

    const thread_id = worker.get_id();

    return thread_id;
  }

  async async_start_on_thread(
    args: Array<string>,
    env: Array<string>,
    fd_map: Array<[number, number] | undefined>,
  ): Promise<number> {
    if (!self.Worker.toString().includes("[native code]")) {
      if (self.Worker.toString().includes("function")) {
        console.warn("SubWorker(new Worker on Worker) is polyfilled maybe.");
      } else {
        throw new Error("SubWorker(new Worker on Worker) is not supported.");
      }
    }

    if (this.worker_background_worker === undefined) {
      throw new Error("worker_background_worker is undefined.");
    }

    return await this.worker_background_ref.async_start_on_thread(
      this.worker_url,
      { type: "module" },
      {
        this_is_thread_spawn: true,
        this_is_start: true,
        args,
        env,
        fd_map,
      },
    );
  }

  block_start_on_thread(
    args: Array<string>,
    env: Array<string>,
    fd_map: Array<[number, number] | undefined>,
  ): number {
    if (!self.Worker.toString().includes("[native code]")) {
      if (self.Worker.toString().includes("function")) {
        console.warn("SubWorker(new Worker on Worker) is polyfilled maybe.");
      } else {
        throw new Error("SubWorker(new Worker on Worker) is not supported.");
      }
    }

    if (this.worker_background_worker === undefined) {
      throw new Error("worker_background_worker is undefined.");
    }

    return this.worker_background_ref.block_start_on_thread(
      this.worker_url,
      { type: "module" },
      {
        this_is_thread_spawn: true,
        this_is_start: true,
        args,
        env,
        fd_map,
      },
    );
  }

  get_share_memory(): WebAssembly.Memory {
    return this.share_memory;
  }

  done_notify(code: number): void {
    this.worker_background_ref.done_notify(code);
  }
}

// send fd_map is not implemented yet.
// issue: the fd passed to the child process is different from the parent process.
export const thread_spawn_on_worker = async (msg: {
  this_is_thread_spawn: boolean;
  worker_id: number;
  start_arg: number;
  worker_background_ref: WorkerBackgroundRefObject;
  sl_object: ThreadSpawnerObject;
  thread_spawn_wasm: WebAssembly.Module;
  args: Array<string>;
  env: Array<string>;
  fd_map: [number, number][];
  this_is_start?: boolean;
}): Promise<WASIFarmAnimal | undefined> => {
  if (msg.this_is_thread_spawn) {
    const {
      sl_object,
      fd_map,
      worker_background_ref,
      thread_spawn_wasm,
      args,
      env,
    } = msg;

    const override_fd_map: Array<number[]> = new Array(
      sl_object.wasi_farm_refs_object.length,
    );

    // Possibly null (undefined)
    for (const fd_and_wasi_ref_n of fd_map) {
      if ((fd_and_wasi_ref_n ?? undefined) !== undefined) {
        const [fd, wasi_ref_n] = fd_and_wasi_ref_n;
        if (override_fd_map[wasi_ref_n] === undefined) {
          override_fd_map[wasi_ref_n] = [];
        }
        override_fd_map[wasi_ref_n].push(fd);
      }
    }

    const thread_spawner = await ThreadSpawner.init({
      ...sl_object,
      worker_background_ref_object: worker_background_ref,
    });

    if (msg.this_is_start) {
      const wasi = await WASIFarmAnimal.init(
        sl_object.wasi_farm_refs_object,
        args,
        env,
        {
          can_thread_spawn: true,
          hand_override_fd_map: fd_map,
        },
        override_fd_map,
        thread_spawner,
      );

      const inst = await wasi.instantiate_cmd(thread_spawn_wasm);

      try {
        wasi.start(inst);
      } catch (e) {
        globalThis.postMessage({
          msg: "error",
          error: e,
        });

        return wasi;
      }

      globalThis.postMessage({
        msg: "done",
      });

      return wasi;
    }

    const { worker_id: thread_id, start_arg } = msg;

    console.log(`thread_spawn worker ${thread_id} start`);

    const wasi = await WASIFarmAnimal.init(
      sl_object.wasi_farm_refs_object,
      args,
      env,
      {
        can_thread_spawn: true,
        hand_override_fd_map: fd_map,
      },
      override_fd_map,
      thread_spawner,
    );

    const inst = await wasi.instantiate_thread(thread_spawn_wasm);

    globalThis.postMessage({
      msg: "ready",
    });

    try {
      wasi.wasi_thread_start(inst, thread_id, start_arg);
    } catch (e) {
      globalThis.postMessage({
        msg: "error",
        error: e,
      });

      return wasi;
    }

    globalThis.postMessage({
      msg: "done",
    });

    return wasi;
  }
};
