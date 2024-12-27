export {
  type WasiP1Cmd,
  as_wasi_p1_cmd,
  assert_wasi_p1_cmd,
  is_wasi_p1_cmd,
} from "./wasi_p1_cmd";
export {
  type WasiP1Thread,
  as_wasi_p1_thread,
  assert_wasi_p1_thread,
  is_wasi_p1_thread,
} from "./wasi_p1_thread";
export {
  type WasiP1Reactor,
  as_wasi_p1_reactor,
  assert_wasi_p1_reactor,
  is_wasi_p1_reactor,
} from "./wasi_p1_reactor";

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

export type { WasiP1Imports } from "./wasi_p1_defs_simple";
