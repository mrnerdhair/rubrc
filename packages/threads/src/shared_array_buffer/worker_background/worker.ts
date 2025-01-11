/// <reference lib="webworker" />

// If you create a worker and try to increase the number of threads,
// you will have to use Atomics.wait because they need to be synchronized.
// However, this is essentially impossible because Atomics.wait blocks the threads.
// Therefore, a dedicated worker that creates a subworker (worker in worker) is prepared.
// The request is made using BroadcastChannel.

import * as Comlink from "comlink";
import {
  assume,
  setTransferHandlers,
  wrappedWorkerInit,
  wrappedWorkerTerminate,
} from "rubrc-util";
import type { WrappedWorker } from "rubrc-util";
import { AllocatorUseArrayBuffer } from "../allocator";
import {
  Caller,
  type CallerTarget,
  Listener,
  type ListenerTarget,
  Locker,
  type LockerTarget,
} from "../locking";
import * as Serializer from "../serialize_error";
import type { ThreadSpawnerObject } from "../thread_spawn";
import {
  WorkerBackgroundFuncNames,
  WorkerBackgroundReturnCodes,
} from "../util";
import type {
  ThreadSpawnWorker,
  ThreadSpawnWorkerInit,
} from "./thread_spawn_worker.ts";
import ThreadSpawnWorkerCtor from "./thread_spawn_worker.ts?worker";
import type { WorkerBackgroundRefObject } from "./worker_export";

const threadSpawnWorkerInit = wrappedWorkerInit<ThreadSpawnWorkerInit>(
  ThreadSpawnWorkerCtor,
);

// Note that postMessage, etc.
// cannot be used in a blocking environment such as during wasm execution.
// (at least as far as I have tried)

export type OverrideObject = {
  sl_object: ThreadSpawnerObject & { share_memory: object };
  module: WebAssembly.Module;
};

export class WorkerBackground {
  private readonly override_object: OverrideObject;
  private readonly allocator: AllocatorUseArrayBuffer;
  private readonly locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };

  private locker: Locker;
  private listener: Listener;
  private done_caller: Caller;

  // worker_id starts from 1
  private readonly workers: Array<
    WrappedWorker<ThreadSpawnWorker> | undefined
  > = [undefined];

  private start_worker?: WrappedWorker<ThreadSpawnWorker>;

  protected constructor(
    override_object: OverrideObject,
    locks: {
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
      done_call: CallerTarget;
      done_listen: ListenerTarget;
    },
    allocator: AllocatorUseArrayBuffer,
  ) {
    this.override_object = override_object;
    this.locks = locks;
    this.locker = new Locker(this.locks.lock);
    this.listener = new Listener(this.locks.listen);
    this.done_caller = new Caller(this.locks.done_call);
    this.allocator = allocator;
    this.listen();
  }

  static async init(
    override_object: OverrideObject,
    worker_background_ref_object: WorkerBackgroundRefObject,
  ): Promise<WorkerBackground> {
    return new WorkerBackground(
      override_object,
      worker_background_ref_object.locks,
      await AllocatorUseArrayBuffer.init(
        worker_background_ref_object.allocator,
      ),
    );
  }

  assign_worker_id(): number {
    for (let i = 1; i < this.workers.length; i++) {
      if (this.workers[i] === undefined) {
        return i;
      }
    }
    this.workers.push(undefined);
    return this.workers.length - 1;
  }

  ref(): WorkerBackgroundRefObject {
    return {
      allocator: this.allocator.get_ref(),
      locks: this.locks,
    } as WorkerBackgroundRefObject;
  }

  async listen(): Promise<void> {
    this.locker.reset();

    const listener = this.listener;
    listener.reset();
    while (true) {
      await listener.listen(async (data) => {
        const signature_input = data.i32[0];
        const json_ptr = data.i32[1];
        const json_len = data.i32[2];

        const json_buff = this.allocator.get_memory(json_ptr, json_len);
        this.allocator.free(json_ptr, json_len);

        const json = new TextDecoder().decode(json_buff);
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== "object" || Array.isArray(obj))
          throw new Error("expected JSON object");
        assume<{
          args: Array<string>;
          env: Array<string>;
          fd_map: Array<[number, number] | undefined>;
        }>(obj);

        const gen_worker = async () => {
          return await threadSpawnWorkerInit({
            ...this.override_object,
            ...obj,
            worker_background_ref: this.ref(),
          });
        };

        const { promise: donePromise, resolve: doneResolve } =
          Promise.withResolvers<number>();

        donePromise.then(
          async (value) => {
            if (signature_input !== WorkerBackgroundFuncNames.create_start)
              return;
            await this.done_caller.call_and_wait(async (data) => {
              data.i32[0] = WorkerBackgroundReturnCodes.completed;
              data.i32[1] = value;
            });
          },
          async (error) => {
            console.error(error);
            if (!(error instanceof Error)) throw error;
            const serialized_error = Serializer.serialize(error);

            const ptr_len_buf = new Uint32Array(
              2 * Uint32Array.BYTES_PER_ELEMENT,
            );
            await this.allocator.async_write(
              new TextEncoder().encode(JSON.stringify(serialized_error)),
              ptr_len_buf,
              0,
            );
            const [ptr, len] = ptr_len_buf;

            await this.done_caller.call_and_wait(async (data) => {
              data.i32[0] = WorkerBackgroundReturnCodes.threw;
              data.i32[1] = ptr;
              data.i32[2] = len;
            });
          },
        );

        switch (signature_input) {
          case WorkerBackgroundFuncNames.create_new_worker: {
            assume<{
              start_arg: number;
            }>(obj);

            const worker = await gen_worker();

            const worker_id = this.assign_worker_id();

            console.log(`new worker ${worker_id}`);

            this.workers[worker_id] = worker;

            const { promise: readyPromise, resolve: readyResolve } =
              Promise.withResolvers<void>();

            doneResolve(
              (async () => {
                try {
                  const out = await worker.thread_start(
                    worker_id,
                    obj.start_arg,
                    readyResolve,
                  );

                  console.log(`worker ${worker_id} done so terminate`);
                  wrappedWorkerTerminate(this.workers[worker_id]);
                  this.workers[worker_id] = undefined;

                  return out;
                } catch (e) {
                  console.warn(`worker ${worker_id} error so terminate`);
                  wrappedWorkerTerminate(this.workers[worker_id]);
                  this.workers[worker_id] = undefined;

                  let n = 0;
                  for (const worker of this.workers) {
                    if (worker !== undefined) {
                      console.warn(
                        `wasi throw error but child process exists, terminate ${n}`,
                      );
                      wrappedWorkerTerminate(worker);
                    }
                    n++;
                  }
                  if (this.start_worker !== undefined) {
                    console.warn(
                      "wasi throw error but wasi exists, terminate wasi",
                    );
                    wrappedWorkerTerminate(this.start_worker);
                  }

                  this.workers.length = 0;
                  this.workers.push(undefined);
                  this.start_worker = undefined;

                  throw e;
                }
              })(),
            );

            await readyPromise;

            data.i32[0] = worker_id;

            break;
          }
          case WorkerBackgroundFuncNames.create_start: {
            new Uint8Array(
              this.override_object.sl_object.share_memory.buffer,
            ).fill(0);

            const worker = await gen_worker();
            this.start_worker = worker;

            doneResolve(
              (async () => {
                try {
                  const out = await worker.start();

                  for (const [worker, n] of this.workers
                    .filter((x) => !!x)
                    .map((x, i) => [x, i] as const)) {
                    console.warn(`wasi done but worker exists, terminate ${n}`);
                    wrappedWorkerTerminate(worker);
                  }

                  console.log("start worker done so terminate");
                  wrappedWorkerTerminate(this.start_worker);
                  this.start_worker = undefined;

                  return out;
                } catch (e) {
                  let n = 0;
                  for (const worker of this.workers) {
                    if (worker !== undefined) {
                      console.warn(
                        `wasi throw error but worker exists, terminate ${n}`,
                      );
                      wrappedWorkerTerminate(worker);
                    }
                    n++;
                  }
                  if (this.start_worker !== undefined) {
                    console.warn(
                      "wasi throw error but wasi exists, terminate start worker",
                    );
                    wrappedWorkerTerminate(this.start_worker);
                  }

                  this.workers.length = 0;
                  this.workers.push(undefined);
                  this.start_worker = undefined;

                  throw e;
                }
              })(),
            );

            break;
          }
        }
      });
    }
  }
}

export type WorkerBackgroundInit = typeof WorkerBackground.init;

setTransferHandlers();
Comlink.expose(WorkerBackground.init, self);
