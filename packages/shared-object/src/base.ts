/// <reference types="@types/web" />

/*
 * Project: https://github.com/oligamiq/SharedObject
 * Copyright (c) 2024 oligamiq
 *
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * and the MIT License (see LICENSE-MIT for details).
 */

import type { Msg } from "./mod";

export class SharedObject {
  kept_object: unknown;
  room_id: string;
  id: string;
  bc: globalThis.BroadcastChannel;

  constructor(object: unknown, id: string) {
    this.kept_object = object;
    this.room_id = `shared-object-${id}`;
    this.id = "parent";

    this.bc = new globalThis.BroadcastChannel(this.room_id);
    this.register();
  }

  // call(
  //   name: string,
  //   // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  //   args: any[]
  // ) {
  // }

  private register() {
    const bc = this.bc;

    bc.onmessage = (event) => {
      const data = event.data as Msg;
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

  private func_call(data: Msg) {
    const bc = this.bc;

    const { names, args, id } = data as unknown as {
      names: Array<string>,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      args: any[],
      id: string,
    };
    try {
      if (names.length === 1 && names[0] === ".self") {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const ret = (this.kept_object as any)(...args);
        bc.postMessage({
          msg: "func_call::return",
          ret,
          id,
          from: this.id,
          to: data.from,
        });

        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      let obj: any = this.kept_object;
      for (const name of names) {
        obj = obj[name];
      }

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

  private get(data: Msg) {
    const bc = this.bc;

    const { names, id } = data as unknown as {
      names: Array<string>,
      id: string,
    };
    try {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      let obj: any = this.kept_object;
      for (const name of names) {
        obj = obj[name];
      }

      bc.postMessage({
        msg: "get::return",
        ret: obj,
        id,
        from: this.id,
        to: data.from,
        can_post: true
      });
    } catch (e) {
      if ((e as { name: string }).name === "DataCloneError") {
        bc.postMessage({
          msg: "get::data_clone_error",
          error: e,
          id,
          from: this.id,
          to: data.from,
          can_post: false
        });

        return;
      }

      bc.postMessage({
        msg: "get::error",
        error: e,
        id,
        from: this.id,
        to: data.from,
        can_post: false
      });
    }
  }
}
