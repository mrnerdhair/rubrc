import { Abortable } from "rubrc-util";
import type { FdCloseSender } from "../sender";
import {
  AllocatorUseArrayBuffer,
  type AllocatorUseArrayBufferObject,
} from "./allocator";
import {
  Caller,
  type CallerTarget,
  Listener,
  type ListenerTarget,
  new_caller_listener_target,
  new_locker_target,
} from "./locking";

export type FdCloseSenderUseArrayBufferObject = {
  call: CallerTarget;
  listen: ListenerTarget;
  allocator_obj: AllocatorUseArrayBufferObject;
};

// Object to tell other processes,
// such as child processes,
// that the file descriptor has been closed
export class FdCloseSenderUseArrayBuffer
  extends Abortable
  implements FdCloseSender
{
  private readonly caller: Caller;
  private readonly listener: Listener;
  private readonly map = new Map<number, Set<number>>();
  private readonly allocator: AllocatorUseArrayBuffer;

  private get_id_set(fd: number): Set<number> {
    let out = this.map.get(fd);
    if (!out) {
      out = new Set<number>();
      this.map.set(fd, out);
    }
    return out;
  }

  protected constructor({
    caller,
    listener,
    allocator,
  }: {
    caller: Caller;
    listener: Listener;
    allocator: AllocatorUseArrayBuffer;
  }) {
    super();
    this.caller = caller;
    this.listener = listener;
    this.allocator = allocator;
  }

  private listening = false;
  private listen() {
    if (this.listening) return;
    this.listening = true;
    this.resolve(
      this.listener.listen_background(async (data) => {
        const code = data.u32[0];
        switch (code) {
          case 0: {
            const id = data.u32[1];
            const id_set = this.get_id_set(id);
            const removed_fds = Uint32Array.from(id_set.values());
            id_set.clear();
            [data.u32[0], data.u32[1]] =
              await this.allocator.async_write(removed_fds);
            break;
          }
          case 1: {
            const targets = this.allocator.get_memory(
              data.u32[1],
              data.u32[2],
            ).u32;
            const fd = data.u32[3];
            for (const target of targets) {
              this.get_id_set(target).add(fd);
            }
            break;
          }
          default: {
            throw new Error("unexpected code");
          }
        }
      }),
    );
  }

  // Send the closed file descriptor to the target process
  async send(targets: Array<number>, fd: number): Promise<void> {
    await this.caller.call_and_wait(async (data) => {
      data.u32[0] = 1;
      [data.u32[1], data.u32[2]] = await this.allocator.async_write(
        Uint32Array.from(targets),
      );
      data.u32[3] = fd;
    });
  }

  // Get the closed file descriptor from the target process
  get(id: number): Array<number> | undefined {
    const out = this.caller.call_and_wait_blocking(
      (data) => {
        data.u32[0] = 0;
        data.u32[1] = id;
      },
      (data) => {
        const [ptr, len] = [data.u32[0], data.u32[1]];
        const fds = this.allocator.get_memory(ptr, len).u32;
        const out = Array.from(fds);
        return out;
      },
    );
    return out.length === 0 ? undefined : out;
  }

  get_ref(): FdCloseSenderUseArrayBufferObject {
    return {
      call: this.caller.target,
      listen: this.listener.target,
      allocator_obj: this.allocator.get_ref(),
    };
  }

  // Initialize the class from object
  static async init(
    sl?: FdCloseSenderUseArrayBufferObject,
  ): Promise<FdCloseSenderUseArrayBuffer> {
    if (!sl) {
      const [call, listen] = new_caller_listener_target(
        4 * Uint32Array.BYTES_PER_ELEMENT,
      );
      const [caller, listener, allocator] = await Promise.all([
        await Caller.init(call),
        await Listener.init(listen),
        await AllocatorUseArrayBuffer.init({
          share_arrays_memory: new SharedArrayBuffer(64 * 1024),
          share_arrays_memory_lock: new_locker_target(),
        }),
      ]);
      const out = new FdCloseSenderUseArrayBuffer({
        caller,
        listener,
        allocator,
      });
      out.listen();
      return out;
    }
    return new FdCloseSenderUseArrayBuffer({
      caller: await Caller.init(sl.call),
      listener: await Listener.init(sl.listen),
      allocator: await AllocatorUseArrayBuffer.init(sl.allocator_obj),
    });
  }
}
