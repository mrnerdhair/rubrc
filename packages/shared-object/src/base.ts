/*
 * Project: https://github.com/oligamiq/SharedObject
 * Copyright (c) 2024 oligamiq
 *
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * and the MIT License (see LICENSE-MIT for details).
 */

import type { Msg } from "./mod";

function isIndexable(
  x: unknown,
): x is Record<string | number | symbol, unknown> {
  return x !== null && (typeof x === "object" || typeof x === "function");
}

export class SharedObject {
  kept_object: unknown;
  room_id: string;
  id: string;
  bc: Omit<globalThis.BroadcastChannel, "postMessage"> & {
    postMessage(message: Msg): void;
  };

  constructor(object: unknown, id: string) {
    this.kept_object = object;
    this.room_id = `shared-object-${id}`;
    this.id = "parent";

    this.bc = new globalThis.BroadcastChannel(this.room_id);
    this.register();
  }

  // call(
  //   name: string,
  //   args: unknown[]
  // ) {
  // }

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

      if (data.msg === "func_call::call") {
        this.func_call(data);
      }

      if (data.msg === "get::get") {
        this.get(data);
      }
    };
  }

  private is_my_msg(msg: Msg) {
    return msg.from === this.id;
  }

  private func_call(data: Msg & { msg: "func_call::call" }) {
    const bc = this.bc;

    const { names, args, id } = data;
    try {
      if (names.length === 1 && names[0] === ".self") {
        if (typeof this.kept_object !== "function") {
          throw new Error("expected function");
        }
        const ret = this.kept_object(...args);
        bc.postMessage({
          msg: "func_call::return",
          ret,
          id,
          from: this.id,
          to: data.from,
        });

        return;
      }

      let obj: unknown = this.kept_object;
      for (const name of names) {
        if (!isIndexable(obj)) throw new Error("expected indexable object");
        obj = obj[name];
      }

      if (typeof obj !== "function") throw new Error("expected function");
      const ret = obj(...args);

      bc.postMessage({
        msg: "func_call::return",
        ret,
        id,
        from: this.id,
        to: data.from,
      });
    } catch (e) {
      bc.postMessage({
        msg: "func_call::error",
        error: e,
        id,
        from: this.id,
        to: data.from,
      });
    }
  }

  private get(data: Msg & { msg: "get::get" }) {
    const bc = this.bc;

    const { names, id } = data;
    try {
      let obj: unknown = this.kept_object;
      for (const name of names) {
        if (!isIndexable(obj)) throw new Error("expected indexable object");
        obj = obj[name];
      }

      bc.postMessage({
        msg: "get::return",
        ret: obj,
        id,
        from: this.id,
        to: data.from,
        can_post: true,
      });
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "name" in e &&
        e.name === "DataCloneError"
      ) {
        bc.postMessage({
          msg: "get::data_clone_error",
          error: e,
          id,
          from: this.id,
          to: data.from,
          can_post: false,
        });

        return;
      }

      bc.postMessage({
        msg: "get::error",
        error: e,
        id,
        from: this.id,
        to: data.from,
        can_post: false,
      });
    }
  }
}
