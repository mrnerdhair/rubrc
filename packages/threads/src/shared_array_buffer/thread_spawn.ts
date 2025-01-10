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

import { wrappedWorkerInit } from "rubrc-util";
import type { WASIFarmRefUseArrayBufferObject } from "./ref";
import type { WorkerBackgroundRefObject } from "./worker_background/index";
import { WorkerBackgroundRef } from "./worker_background/index";
import type {
  WorkerBackground,
  WorkerBackgroundInit,
} from "./worker_background/worker";
import WorkerBackgroundCtor from "./worker_background/worker?worker";
import { WorkerBackgroundRefObjectConstructor } from "./worker_background/worker_export";

const workerBackgroundInit =
  wrappedWorkerInit<WorkerBackgroundInit>(WorkerBackgroundCtor);

export type ThreadSpawnerObject = {
  share_memory?: WebAssembly.Memory;
  wasi_farm_refs_object: Array<WASIFarmRefUseArrayBufferObject>;
  MIN_STACK?: number;
  worker_background_ref_object?: WorkerBackgroundRefObject;
  module: WebAssembly.Module;
  // inst_default_buffer_kept: WebAssembly.Memory;
};

export class ThreadSpawner {
  private share_memory: WebAssembly.Memory;
  private worker_background_ref: WorkerBackgroundRef;
  // inst_default_buffer_kept: WebAssembly.Memory;

  // hold the worker to prevent GC.
  private worker_background_worker?: WorkerBackground;

  // https://github.com/rustwasm/wasm-pack/issues/479

  static async init({
    wasi_farm_refs_object,
    share_memory,
    MIN_STACK,
    worker_background_ref_object,
    module,
    // inst_default_buffer_kept,
  }: ThreadSpawnerObject): Promise<ThreadSpawner> {
    // 16MB for the time being.
    // https://users.rust-lang.org/t/what-is-the-size-limit-of-threads-stack-in-rust/11867/3
    MIN_STACK ??= 16777216;
    const worker_background_worker_init = worker_background_ref_object
      ? undefined
      : workerBackgroundInit;
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
      share_memory,
      // inst_default_buffer_kept,
      worker_background_worker: await worker_background_worker_init?.(
        {
          sl_object: {
            share_memory,
            wasi_farm_refs_object,
            worker_background_ref_object,
            // inst_default_buffer_kept,
          },
          module,
        },
        worker_background_ref_object,
      ),
      worker_background_ref,
    });
  }

  protected constructor({
    share_memory,
    // inst_default_buffer_kept,
    worker_background_worker,
    worker_background_ref,
  }: {
    share_memory: WebAssembly.Memory;
    // inst_default_buffer_kept: WebAssembly.Memory,
    worker_background_worker: WorkerBackground | undefined;
    worker_background_ref: WorkerBackgroundRef;
  }) {
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
