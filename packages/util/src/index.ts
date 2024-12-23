import {
  type WasiP1Cmd,
  as_wasi_p1_cmd,
  assert_wasi_p1_cmd,
  is_wasi_p1_cmd,
} from "./wasi_p1_cmd";
import {
  type WasiP1Thread,
  as_wasi_p1_thread,
  assert_wasi_p1_thread,
  is_wasi_p1_thread,
} from "./wasi_p1_thread";

export {
  type WasiP1Cmd,
  is_wasi_p1_cmd,
  assert_wasi_p1_cmd,
  as_wasi_p1_cmd,
  type WasiP1Thread,
  is_wasi_p1_thread,
  assert_wasi_p1_thread,
  as_wasi_p1_thread,
};

export { setTransferHandlers } from "./comlink";

export type Terminal = {
  write: (value: string) => void;
  get_err_buff: () => string;
  reset_err_buff: () => void;
  append_err_buff: (value: string) => void;
  get_out_buff: () => string;
  reset_out_buff: () => void;
  append_out_buff: (value: string) => void;
};

export type CmdParser = (...args: string[]) => Promise<void>;
