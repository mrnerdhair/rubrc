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
  type AtomicTarget,
  Caller,
  Listener,
  Locker,
  new_atomic_target,
} from "../locking";
import * as Serializer from "../serialize_error";
import type { ThreadSpawnerObject } from "../thread_spawn";
import type { WorkerBackgroundRefObject } from "./worker_export";

// Note that postMessage, etc.
// cannot be used in a blocking environment such as during wasm execution.
// (at least as far as I have tried)

export type OverrideObject = {
  sl_object: ThreadSpawnerObject;
  thread_spawn_wasm: WebAssembly.Module | undefined;
};

export class WorkerBackground {
  private override_object: OverrideObject;
  private allocator: AllocatorUseArrayBuffer;
  private lock: SharedArrayBuffer;
  private locks: Record<"lock" | "call" | "done", AtomicTarget>;
  private signature_input: SharedArrayBuffer;

  // worker_id starts from 1
  private workers: Array<Worker | undefined> = [undefined];

  private start_worker?: Worker;

  protected constructor(
    override_object: OverrideObject,
    lock?: SharedArrayBuffer,
    locks?: Record<"lock" | "call" | "done", AtomicTarget>,
    allocator?: AllocatorUseArrayBuffer,
    signature_input?: SharedArrayBuffer,
  ) {
    this.override_object = override_object;
    this.lock = lock ?? new SharedArrayBuffer(20);
    this.locks = locks ?? {
      lock: new_atomic_target(),
      call: new_atomic_target(),
      done: new_atomic_target(),
    };
    this.allocator =
      allocator ??
      new AllocatorUseArrayBuffer({
        share_arrays_memory: new SharedArrayBuffer(10 * 1024),
      });
    this.signature_input = signature_input ?? new SharedArrayBuffer(24);
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
      lock: this.lock,
      locks: this.locks,
      signature_input: this.signature_input,
    };
  }

  async listen(): Promise<void> {
    new Locker(this.locks.lock).reset();

    const signature_input_view = new Int32Array(this.signature_input);

    const listener = new Listener(this.locks.call);
    listener.reset();
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

        const signature_input = Atomics.load(signature_input_view, 0);
        switch (signature_input) {
          // create new worker
          case 1: {
            const worker = gen_worker();
            const obj = gen_obj();

            const worker_id = this.assign_worker_id();

            console.log(`new worker ${worker_id}`);

            this.workers[worker_id] = worker;

            const { promise, resolve } = Promise.withResolvers<void>();

            worker.onmessage = async (e) => {
              const { msg } = e.data;

              if (msg === "ready") {
                resolve();
              }

              if (msg === "done") {
                console.log(`worker ${worker_id} done so terminate`);

                this.workers[worker_id]?.terminate();
                this.workers[worker_id] = undefined;
              }

              if (msg === "error") {
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

                this.workers = [undefined];
                this.start_worker = undefined;

                const error = e.data.error;

                const notify_view = new Int32Array(this.lock, 8);
                const caller = new Caller(this.locks.done, null);

                const serialized_error = Serializer.serialize(error);

                await this.allocator.async_write(
                  new TextEncoder().encode(JSON.stringify(serialized_error)),
                  new Int32Array(this.lock),
                  3,
                );
                const ptr = Atomics.load(notify_view, 0);
                const len = Atomics.load(notify_view, 1);

                try {
                  caller.call(1);
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

            await promise;

            Atomics.store(signature_input_view, 0, worker_id);

            break;
          }
          // create start
          case 2: {
            this.start_worker = gen_worker();
            const obj = gen_obj();

            this.start_worker.onmessage = async (e) => {
              const { msg } = e.data;

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

                this.workers = [undefined];
                this.start_worker = undefined;

                const error = e.data.error;

                const notify_view = new Int32Array(this.lock, 8);
                const caller = new Caller(this.locks.done, null);

                const serialized_error = Serializer.serialize(error);

                await this.allocator.async_write(
                  new TextEncoder().encode(JSON.stringify(serialized_error)),
                  new Int32Array(this.lock),
                  3,
                );
                const ptr = Atomics.load(notify_view, 0);
                const len = Atomics.load(notify_view, 1);

                try {
                  caller.call(1);
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
      });
    }
  }
}

export type WorkerBackgroundInit = typeof WorkerBackground.init;

setTransferHandlers();
Comlink.expose(WorkerBackground.init, self);
