/*
 * Project: https://github.com/oligamiq/SharedObject
 * Copyright (c) 2024 oligamiq
 *
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * and the MIT License (see LICENSE-MIT for details).
 */

export type Msg = MsgBase & {
  from: string;
  to: string;
};

export type MsgBase = {
  id: string;
  from?: string;
  to?: string;
} & (
  | {
      msg: "func_call::call";
      names: Array<string | number | symbol>;
      args: unknown[];
    }
  | {
      msg: "func_call::return";
      ret: unknown;
    }
  | {
      msg: "func_call::error";
      error: unknown;
    }
  | {
      msg: "get::get";
      names: Array<string | number | symbol>;
    }
  | {
      msg: "get::return";
      ret: unknown;
      can_post: true;
    }
  | {
      msg: "get::data_clone_error";
      error: unknown;
      can_post: false;
    }
  | {
      msg: "get::error";
      error: unknown;
      can_post: false;
    }
  | {
      msg: "callback::call";
      name: string | number | symbol;
      args: unknown[];
    }
  | {
      msg: "callback::return";
      ret: unknown;
    }
  | {
      msg: "callback::promise";
    }
  | {
      msg: "callback::promise_return";
      ret: unknown;
    }
  | {
      msg: "callback::error";
      error: unknown;
    }
);
