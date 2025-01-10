/// <reference lib="webworker" />

// If you create a worker and try to increase the number of threads,
// you will have to use Atomics.wait because they need to be synchronized.
// However, this is essentially impossible because Atomics.wait blocks the threads.
// Therefore, a dedicated worker that creates a subworker (worker in worker) is prepared.
// The request is made using BroadcastChannel.

import * as Comlink from "comlink";
import { setTransferHandlers } from "rubrc-util";
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
import worker_url from "./thread_spawn_worker.ts?worker&url";
import type { WorkerBackgroundRefObject } from "./worker_export";

// Note that postMessage, etc.
// cannot be used in a blocking environment such as during wasm execution.
// (at least as far as I have tried)

export type OverrideObject = {
  sl_object: ThreadSpawnerObject;
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
  private readonly workers: Array<Worker | undefined> = [undefined];

  private start_worker?: Worker;

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
      allocator: this.allocator.get_object(),
      locks: this.locks,
    } as WorkerBackgroundRefObject;
  }

  async listen(): Promise<void> {
    this.locker.reset();

    const listener = this.listener;
    listener.reset();
    while (true) {
      await listener.listen(async (data) => {
        const gen_worker = () => {
          console.log("gen_worker");
          const is_module = data.i32[1] === 1;
          return new Worker(worker_url, {
            type: is_module ? "module" : "classic",
          });
        };

        const gen_obj = (): Record<string, unknown> => {
          console.log("gen_obj");
          const json_ptr = data.i32[2];
          const json_len = data.i32[3];
          const json_buff = this.allocator.get_memory(json_ptr, json_len);
          this.allocator.free(json_ptr, json_len);
          const json = new TextDecoder().decode(json_buff);
          const out = JSON.parse(json);
          if (!out || typeof out !== "object" || Array.isArray(out))
            throw new Error("expected JSON object");
          return out;
        };

        const { promise: donePromise, resolve: doneResolve } =
          Promise.withResolvers<
            | [WorkerBackgroundReturnCodes.completed, number]
            | [WorkerBackgroundReturnCodes.threw, [number, number]]
          >();

        donePromise.then(async ([code, value]) => {
          switch (code) {
            case WorkerBackgroundReturnCodes.completed: {
              // await this.done_caller.call_and_wait(async (data) => {
              //   data.i32[0] = code;
              //   data.i32[1] = value;
              // });
              break;
            }
            case WorkerBackgroundReturnCodes.threw: {
              await this.done_caller.call_and_wait(async (data) => {
                data.i32[0] = code;
                data.i32[1] = value[0];
                data.i32[2] = value[1];
              });
              break;
            }
            default: {
              throw new Error(`unknown code ${code}`);
            }
          }
        });

        const signature_input = data.i32[0];
        switch (signature_input) {
          case WorkerBackgroundFuncNames.create_new_worker: {
            const worker = gen_worker();
            const obj = gen_obj();

            const worker_id = this.assign_worker_id();

            console.log(`new worker ${worker_id}`);

            this.workers[worker_id] = worker;

            const { promise: readyPromise, resolve: readyResolve } =
              Promise.withResolvers<void>();

            worker.onmessage = async (e) => {
              const { msg, code } = e.data;

              if (msg === "ready") {
                readyResolve();
              }

              if (msg === "done") {
                console.log(`worker ${worker_id} done so terminate`);

                this.workers[worker_id]?.terminate();
                this.workers[worker_id] = undefined;

                doneResolve([WorkerBackgroundReturnCodes.completed, code]);
              }

              if (msg === "error") {
                console.warn(`worker ${worker_id} error so terminate`);
                this.workers[worker_id]?.terminate();
                this.workers[worker_id] = undefined;

                let n = 0;
                for (const worker of this.workers) {
                  if (worker !== undefined) {
                    console.warn(
                      `wasi throw error but child process exists, terminate ${n}`,
                    );
                    worker.terminate();
                  }
                  n++;
                }
                if (this.start_worker !== undefined) {
                  console.warn(
                    "wasi throw error but wasi exists, terminate wasi",
                  );
                  this.start_worker.terminate();
                }

                this.workers.length = 0;
                this.workers.push(undefined);
                this.start_worker = undefined;

                const error = e.data.error;

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

                try {
                  console.error(error);
                  doneResolve([WorkerBackgroundReturnCodes.threw, [ptr, len]]);
                } catch (e) {
                  this.allocator.free(ptr, len);
                }
              }
            };

            worker.postMessage({
              ...this.override_object,
              ...obj,
              worker_id,
              worker_background_ref: this.ref(),
            });

            await readyPromise;

            data.i32[0] = worker_id;

            break;
          }
          case WorkerBackgroundFuncNames.create_start: {
            this.start_worker = gen_worker();
            const obj = gen_obj();

            this.start_worker.onmessage = async (e) => {
              const { msg, code } = e.data;

              if (msg === "done") {
                let n = 0;
                for (const worker of this.workers) {
                  if (worker !== undefined) {
                    console.warn(`wasi done but worker exists, terminate ${n}`);
                    worker.terminate();
                  }
                  n++;
                }

                console.log("start worker done so terminate");

                this.start_worker?.terminate();
                this.start_worker = undefined;

                doneResolve([WorkerBackgroundReturnCodes.completed, code]);
              }

              if (msg === "error") {
                let n = 0;
                for (const worker of this.workers) {
                  if (worker !== undefined) {
                    console.warn(
                      `wasi throw error but worker exists, terminate ${n}`,
                    );
                    worker.terminate();
                  }
                  n++;
                }
                if (this.start_worker !== undefined) {
                  console.warn(
                    "wasi throw error but wasi exists, terminate start worker",
                  );
                  this.start_worker.terminate();
                }

                this.workers.length = 0;
                this.workers.push(undefined);
                this.start_worker = undefined;

                const error = e.data.error;

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

                try {
                  console.error(error);
                  doneResolve([WorkerBackgroundReturnCodes.threw, [ptr, len]]);
                } catch (e) {
                  this.allocator.free(ptr, len);
                }
              }
            };

            this.start_worker.postMessage({
              ...this.override_object,
              ...obj,
              worker_background_ref: this.ref(),
            });

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
