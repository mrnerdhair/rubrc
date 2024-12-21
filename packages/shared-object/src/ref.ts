/*
 * Project: https://github.com/oligamiq/SharedObject
 * Copyright (c) 2024 oligamiq
 *
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * and the MIT License (see LICENSE-MIT for details).
 */

import type { Msg, MsgBase } from "./mod";

export class SharedObjectRef {
  private room_id: string;
  private id: string;
  private map: Map<string, (value: Msg | PromiseLike<Msg>) => void> = new Map();
  private bc: Omit<BroadcastChannel, "postMessage"> & {
    postMessage(message: Msg): void;
  };
  private callbacks: Array<(...args: unknown[]) => unknown> = [];

  constructor(id: string) {
    this.room_id = `shared-object-${id}`;

    this.id = this.get_id();
    this.bc = new globalThis.BroadcastChannel(this.room_id);
    this.register();
  }

  private is_my_msg(msg: Msg) {
    return msg.from === this.id;
  }

  proxy<T extends object>() {
    return new Proxy<T>((() => {}) as T, {
      get: (_, prop) => {
        return this.get([prop]);
      },
      apply: (_, __, args) => {
        return this.call([".self"], args);
      },
    });
  }

  addCallback(callback: (...args: unknown[]) => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (...args: unknown[]) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  private register() {
    const bc = this.bc;

    bc.onmessage = (event: { data: Msg }) => {
      const data = event.data;

      if (data.msg === undefined) {
        throw new Error("Invalid message");
      }

      if (this.is_my_msg(data)) {
        return;
      }
      if (data.to !== this.id) {
        return;
      }

      if (data.msg.startsWith("func_call::")) {
        const resolve = this.map.get(data.id);
        if (resolve !== undefined) {
          resolve(data);
          this.map.delete(data.id);
        } else {
          throw new Error("what happened? unreachable code");
        }
      }

      if (data.msg.startsWith("get::")) {
        const resolve = this.map.get(data.id);
        if (resolve !== undefined) {
          resolve(data);
          this.map.delete(data.id);
        } else {
          throw new Error("what happened? unreachable code");
        }
      }
    };
  }

  private get_id() {
    return Math.random().toString(36).slice(2);
  }

  private check_msg_error(data: Msg) {
    if (
      data.msg === "get::error" ||
      data.msg === "func_call::error" ||
      data.msg === "callback::error"
    ) {
      throw data.error;
    }
  }

  get(names: Array<string | symbol>): PromiseLike<unknown> {
    const { promise, resolve } = Promise.withResolvers<Msg>();

    const id = this.get_id();

    this.map.set(id, resolve);

    this.postMessage({
      msg: "get::get",
      names,
      id,
      from: this.id,
      to: "parent",
    });

    let is_await = false;

    const hook = async () => {
      const data = await promise;

      this.check_msg_error(data);

      if (data.msg === "get::return" || data.msg === "get::data_clone_error") {
        if (is_await) {
          console.warn(
            "Warning!\nObjects that cannot be transferred are being retrieved.",
          );
        }

        const ret = data;

        if (ret.can_post) {
          return ret.ret;
        }
        return new Proxy(() => {}, {
          get: (_, prop) => {
            if (prop === "then") {
              is_await = true;
              // 即座に終わるPromiseを生成して返す
              return Promise.resolve(target);
            }

            return this.get([...names, prop]);
          },
          apply: (_, __, args) => {

            return this.call(names, args);
          },
        });
      }

      throw new Error("what happened? unreachable code");
    };

    const target = hook();

    const proxy = new Proxy<PromiseLike<unknown>>(
      Object.assign(() => {}, {
        // biome-ignore lint/suspicious/noThenProperty: intentionally used to simulate a PromiseLike target
        then(..._args: unknown[]): never {
          throw new Error("unreachable");
        },
      }),
      {
        get: (_, prop) => {
          if (prop === "then") {
            is_await = true;
            return target.then.bind(target);
          }
          return this.get([...names, prop]);
        },
        apply: (_, __, args) => {
          return this.call(names, args);
        },
      },
    );

    return proxy;
  }

  async call(
    names: Array<string | number | symbol>,
    args: unknown[],
  ): Promise<unknown> {
    const { promise, resolve } = Promise.withResolvers<Msg>();

    const id = this.get_id();

    this.map.set(id, resolve);

    this.postMessage({
      msg: "func_call::call",
      names,
      args,
      id,
    });

    const data = await promise;

    this.check_msg_error(data);

    if (data.msg === "func_call::return") {
      return data.ret;
    }

    throw new Error("what happened? unreachable code");
  }

  async call_callback(msg: Msg) {
    const { id } = msg;

    try {
      if (msg.msg === "callback::call") {
        const { name, args } = msg;
        const obj = this.callbacks.find((obj) => obj.name === name);

        if (obj === undefined) {
          throw new Error("function not found");
        }

        const ret = obj(...args);

        if (ret instanceof Promise) {
          this.postMessage({
            msg: "callback::promise",
            id,
          });

          this.postMessage({
            msg: "callback::promise_return",
            ret: await ret,
            id,
          });
        } else {
          this.postMessage({
            msg: "callback::return",
            ret,
            id,
          });
        }
      }
    } catch (e) {
      this.postMessage({
        msg: "callback::error",
        error: e,
        id,
      });
    }
  }

  private postMessage(data: MsgBase) {
    this.bc.postMessage({
      ...data,
      from: this.id,
      to: "parent",
    });
  }
}
