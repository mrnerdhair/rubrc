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
import { Abortable, type WrappedWorker } from "rubrc-util";
import { AllocatorUseArrayBuffer } from "../allocator";
import {
  Caller,
  type CallerTarget,
  Listener,
  type ListenerTarget,
  Locker,
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

export class WorkerBackground extends Abortable {
  private readonly override_object: OverrideObject;
  private readonly allocator: AllocatorUseArrayBuffer;

  private readonly locker: Locker;
  private readonly call: CallerTarget;
  private readonly listener: Listener;
  private readonly done_caller: Caller;
  private readonly done_listen: ListenerTarget;

  // worker_id starts from 1
  private readonly workers: Array<
    WrappedWorker<ThreadSpawnWorker> | undefined
  > = [undefined];

  private start_worker?: WrappedWorker<ThreadSpawnWorker>;

  protected constructor(
    override_object: OverrideObject,
    allocator: AllocatorUseArrayBuffer,
    locker: Locker,
    call: CallerTarget,
    listener: Listener,
    done_caller: Caller,
    done_listen: ListenerTarget,
  ) {
    super();
    this.override_object = override_object;
    this.locker = locker;
    this.call = call;
    this.listener = listener;
    this.done_caller = done_caller;
    this.done_listen = done_listen;
    this.allocator = allocator;
    this.resolve(this.listen());
  }

  static async init(
    override_object: OverrideObject,
    worker_background_ref_object: WorkerBackgroundRefObject,
  ): Promise<WorkerBackground> {
    const [allocator, locker, listener, done_caller] = await Promise.all([
      AllocatorUseArrayBuffer.init(worker_background_ref_object.allocator),
      Locker.init(worker_background_ref_object.lock),
      Listener.init(worker_background_ref_object.listen),
      Caller.init(worker_background_ref_object.done_call),
    ]);
    return new WorkerBackground(
      override_object,
      allocator,
      locker,
      worker_background_ref_object.call,
      listener,
      done_caller,
      worker_background_ref_object.done_listen,
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
      lock: this.locker.target,
      call: this.call,
      listen: this.listener.target,
      done_call: this.done_caller.target,
      done_listen: this.done_listen,
    } as WorkerBackgroundRefObject;
  }

  private listen(): Abortable {
    this.locker.reset();

    const listener = this.listener;
    listener.reset();

    const ready_workers: Array<Promise<WrappedWorker<ThreadSpawnWorker>>> = [];

    return listener
      .listen_background(async (data) => {
        const signature_input = data.i32[0];
        const json = this.allocator.get_string(data.i32[1], data.i32[2]);

        const obj = JSON.parse(json);
        if (!obj || typeof obj !== "object" || Array.isArray(obj))
          throw new Error("expected JSON object");
        assume<{
          args: Array<string>;
          env: Array<string>;
          fd_map: Array<[number, number] | undefined>;
        }>(obj);

        const gen_worker = async () => {
          if (ready_workers.length === 0) {
            ready_workers.push(
              ...Array(1)
                .fill(undefined)
                .map(() =>
                  threadSpawnWorkerInit({
                    ...this.override_object,
                    ...obj,
                    worker_background_ref: this.ref(),
                  }),
                ),
            );
          }
          // biome-ignore lint/style/noNonNullAssertion: we just checked the array above
          return await ready_workers.pop()!;
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

            const [ptr, len] = await this.allocator.async_write(
              JSON.stringify(serialized_error),
            );

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
      })
      .chain(async () => {
        await Promise.all(
          ready_workers.map(async (x) => wrappedWorkerTerminate(await x)),
        );
      });
  }
}

export type WorkerBackgroundInit = typeof WorkerBackground.init;

setTransferHandlers();
Comlink.expose(WorkerBackground.init, self);
