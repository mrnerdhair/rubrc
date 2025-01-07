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
  type AsyncCallerTarget,
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
import type { WorkerBackgroundRefObject } from "./worker_export";

// Note that postMessage, etc.
// cannot be used in a blocking environment such as during wasm execution.
// (at least as far as I have tried)

export type OverrideObject = {
  sl_object: ThreadSpawnerObject;
  thread_spawn_wasm: WebAssembly.Module | undefined;
};

export class WorkerBackground {
  private readonly override_object: OverrideObject;
  private readonly allocator: AllocatorUseArrayBuffer;
  private readonly lock: SharedArrayBuffer;
  private readonly locks: {
    lock: LockerTarget;
    call: AsyncCallerTarget;
    listen: ListenerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };
  private readonly signature_input: SharedArrayBuffer;

  private readonly locker: Locker;
  private readonly listener: Listener;
  private readonly done_caller: Caller;

  private readonly workers = new Map<number, Worker>();
  private readonly next_worker_id: SharedArrayBuffer;

  private start_worker?: Worker;

  protected constructor(
    override_object: OverrideObject,
    lock: SharedArrayBuffer,
    locks: {
      lock: LockerTarget;
      call: AsyncCallerTarget;
      listen: ListenerTarget;
      done_call: CallerTarget;
      done_listen: ListenerTarget;
    },
    allocator: AllocatorUseArrayBuffer,
    signature_input: SharedArrayBuffer,
    next_worker_id: SharedArrayBuffer,
  ) {
    this.override_object = override_object;
    this.lock = lock;
    this.locks = locks;
    this.locker = new Locker(this.locks.lock);
    this.listener = new Listener(this.locks.listen);
    this.done_caller = new Caller(this.locks.done_call);
    this.allocator = allocator;
    this.signature_input = signature_input;
    this.next_worker_id = next_worker_id;
    this.listen();
  }

  static async init(
    override_object: OverrideObject,
    worker_background_ref_object: WorkerBackgroundRefObject,
  ): Promise<WorkerBackground> {
    return new WorkerBackground(
      override_object,
      worker_background_ref_object.lock,
      worker_background_ref_object.locks,
      await AllocatorUseArrayBuffer.init(
        worker_background_ref_object.allocator,
      ),
      worker_background_ref_object.signature_input,
      worker_background_ref_object.next_worker_id,
    );
  }

  ref(): WorkerBackgroundRefObject {
    return {
      allocator: this.allocator.get_object(),
      lock: this.lock,
      locks: this.locks,
      signature_input: this.signature_input,
      next_worker_id: this.next_worker_id,
    } as WorkerBackgroundRefObject;
  }

  async listen(): Promise<void> {
    this.locker.reset();

    const signature_input_view = new Int32Array(this.signature_input);

    const listener = this.listener;
    listener.reset("WorkerBackground listen");
    while (true) {
      await listener.listen(async () => {
        const gen_worker = () => {
          console.log("gen_worker");
          const url_ptr = Atomics.load(signature_input_view, 1);
          const url_len = Atomics.load(signature_input_view, 2);
          const url_buff = this.allocator.get_memory(url_ptr, url_len);
          this.allocator.free(url_ptr, url_len);
          const url = new TextDecoder().decode(url_buff);
          const is_module = Atomics.load(signature_input_view, 3) === 1;
          return new Worker(url, {
            type: is_module ? "module" : "classic",
          });
        };

        const gen_obj = (): Record<string, unknown> => {
          console.log("gen_obj");
          const json_ptr = Atomics.load(signature_input_view, 4);
          const json_len = Atomics.load(signature_input_view, 5);
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
            | [WorkerBackgroundReturnCodes.threw]
          >();

        donePromise.then(([result, _code]) => {
          // if (code !== undefined) {
          //   const notify_view = new Int32Array(this.lock, 8);
          //   Atomics.store(notify_view, 1, code);
          // }
          if (result !== WorkerBackgroundReturnCodes.threw) return;
          this.done_caller.call("WorkerBackground donePromise", result);
        });

        const signature_input = Atomics.load(signature_input_view, 0);
        switch (signature_input) {
          case WorkerBackgroundFuncNames.create_new_worker: {
            const worker = gen_worker();
            const obj = gen_obj();

            const worker_id = Atomics.load(signature_input_view, 6);
            console.log(`new worker ${worker_id}`);
            this.workers.set(worker_id, worker);

            const { promise: readyPromise, resolve: readyResolve } =
              Promise.withResolvers<void>();

            worker.onmessage = async (e) => {
              const { msg, code } = e.data;

              if (msg === "ready") {
                readyResolve();
              }

              if (msg === "done") {
                console.log(`worker ${worker_id} done so terminate`);

                worker.terminate();
                this.workers.delete(worker_id);

                doneResolve([WorkerBackgroundReturnCodes.completed, code]);
              }

              if (msg === "error") {
                worker.terminate();
                this.workers.delete(worker_id);

                for (const [n, worker] of this.workers) {
                  console.warn(
                    `wasi throw error but child process exists, terminate ${n}`,
                  );
                  worker.terminate();
                }
                this.workers.clear();

                if (this.start_worker !== undefined) {
                  console.warn(
                    "wasi throw error but wasi exists, terminate wasi",
                  );
                  this.start_worker.terminate();
                }
                this.start_worker = undefined;

                const error = e.data.error;

                const notify_view = new Int32Array(this.lock, 8);

                const serialized_error = Serializer.serialize(error);

                await this.allocator.async_write(
                  new TextEncoder().encode(JSON.stringify(serialized_error)),
                  new Int32Array(this.lock),
                  3,
                );
                const ptr = Atomics.load(notify_view, 0);
                const len = Atomics.load(notify_view, 1);

                try {
                  console.error(error);
                  doneResolve([WorkerBackgroundReturnCodes.threw]);
                } catch (e) {
                  this.allocator.free(ptr, len);
                  throw e;
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

            break;
          }
          case WorkerBackgroundFuncNames.create_start: {
            this.start_worker = gen_worker();
            const obj = gen_obj();

            this.start_worker.onmessage = async (e) => {
              const { msg, code } = e.data;

              if (msg === "done") {
                for (const [n, worker] of this.workers) {
                  console.warn(`wasi done but worker exists, terminate ${n}`);
                  worker.terminate();
                }
                this.workers.clear();

                console.log("start worker done so terminate");

                this.start_worker?.terminate();
                this.start_worker = undefined;

                doneResolve([WorkerBackgroundReturnCodes.completed, code]);
              }

              if (msg === "error") {
                for (const [n, worker] of this.workers) {
                  console.warn(
                    `wasi throw error but worker exists, terminate ${n}`,
                  );
                  worker.terminate();
                }
                this.workers.clear();

                if (this.start_worker !== undefined) {
                  console.warn(
                    "wasi throw error but wasi exists, terminate start worker",
                  );
                }
                this.start_worker?.terminate();
                this.start_worker = undefined;

                const error = e.data.error;

                const notify_view = new Int32Array(this.lock, 8);

                const serialized_error = Serializer.serialize(error);

                await this.allocator.async_write(
                  new TextEncoder().encode(JSON.stringify(serialized_error)),
                  new Int32Array(this.lock),
                  3,
                );
                const ptr = Atomics.load(notify_view, 0);
                const len = Atomics.load(notify_view, 1);

                try {
                  console.error(error);
                  doneResolve([WorkerBackgroundReturnCodes.threw]);
                } catch (e) {
                  this.allocator.free(ptr, len);
                  throw e;
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
      }, "WorkerBackground listen");
    }
  }
}

export type WorkerBackgroundInit = typeof WorkerBackground.init;

setTransferHandlers();
Comlink.expose(WorkerBackground.init, self);
