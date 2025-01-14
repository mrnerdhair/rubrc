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
