import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import XTerm from "./solid_xterm";
import { WASIFarm, type WASIFarmRef } from "@oligami/browser_wasi_shim-threads";
import {
  Directory,
  Fd,
  type Inode,
  PreopenDirectory,
} from "@bjorn3/browser_wasi_shim";
import type { Ctx } from "./ctx";
import { rust_file } from "./config";

let error_buff = "";
let out_buff = "";

export const SetupMyTerminal = (props: {
  ctx: Ctx;
  callback: (wasi_ref: WASIFarmRef) => void;
}) => {
  let xterm: Terminal | undefined = undefined;

  const fit_addon = new FitAddon();

  const terminal_queue: string[] = [];
  const write_terminal = (str: string) => {
    if (xterm) {
      xterm.write(str);
    } else {
      terminal_queue.push(str);
    }
  };
  write_terminal.reset_err_buff = () => {
    error_buff = "";
  };
  write_terminal.get_err_buff = () => {
    console.log("called get_err_buff");
    return error_buff;
  };
  write_terminal.get_out_buff = () => {
    console.log("called get_out_buff");
    return out_buff;
  };
  write_terminal.reset_out_buff = () => {
    out_buff = "";
  };

  // shared_xterm
  new SharedObject(write_terminal, props.ctx.terminal_id);

  const handleMount = (terminal: Terminal) => {
    xterm = terminal;
    xterm.write(terminal_queue.join(""));
    terminal_queue.length = 0;
    get_ref(terminal, props.callback);
    fit_addon.fit();
    return () => {
      console.log("Terminal unmounted.");
    };
  };

  let keys = "";

  const waiter = new SharedObjectRef(props.ctx.waiter_id).proxy<{
    is_all_done: () => boolean;
  }>();
  let cmd_parser: (...args: string[]) => void;

  let before_cmd = "";
  // @ts-expect-error
  const on_enter = async (terminal) => {
    before_cmd = keys;
    terminal.write("\r\n");
    if (await waiter.is_all_done()) {
      cmd_parser = new SharedObjectRef(props.ctx.cmd_parser_id).proxy<
        (...args: string[]) => void
      >();
      const parsed = keys.split(" ");
      await cmd_parser(...parsed);
    } else {
      terminal.write("this is not done yet\r\n");
    }
    keys = "";
  };
  const keydown = (
    event: { key: string; domEvent: KeyboardEvent },
    // @ts-expect-error
    terminal,
  ) => {
    if (event.key === "\r") {
      terminal.write("\r\n");
      on_enter(terminal);
    } else if (event.domEvent.code === "Backspace") {
      terminal.write("\b \b");
      keys = keys.slice(0, -1);
    } else if (event.domEvent.code === "ArrowUp") {
      keys = before_cmd;
      terminal.write(`\r>${keys} \r`);
    } else if (
      event.domEvent.code === "ArrowDown" ||
      event.domEvent.code === "ArrowLeft" ||
      event.domEvent.code === "ArrowRight" ||
      event.domEvent.code === "Tab"
    ) {
      terminal.write(event.key);
    } else if (
      // Ctrl + V
      event.domEvent.ctrlKey &&
      event.domEvent.code === "KeyV"
    ) {
      navigator.clipboard.readText().then((text) => {
        keys += text;
        terminal.write(text);
      });
    } else {
      keys += event.key;
      terminal.write(event.key);
    }
  };

  // You can pass either an ITerminalAddon constructor or an instance, depending on whether you need to access it later.
  return (
    <XTerm
      onMount={handleMount}
      onKey={keydown}
      addons={[fit_addon]}
      class="w-full"
    />
  );
};

// @ts-expect-error
const get_ref = (term, callback) => {
  class XtermStdio extends Fd {
    term: Terminal;

    constructor(term: Terminal) {
      super();
      this.term = term;
    }
    fd_write(data: Uint8Array) /*: {ret: number, nwritten: number}*/ {
      const decoded = new TextDecoder().decode(data);
      // \n to \r\n
      const fixed = decoded.replace(/\n/g, "\r\n");
      this.term.write(fixed);

      out_buff += fixed;

      return { ret: 0, nwritten: data.byteLength };
    }
    fd_seek() {
      // wasi.ERRNO_BADF 8
      return { ret: 8, offset: 0n };
    }
    fd_filestat_get() {
      // wasi.ERRNO_BADF 8
      return { ret: 8, filestat: null };
    }
  }

  class XtermStderr extends Fd {
    term: Terminal;

    constructor(term: Terminal) {
      super();
      this.term = term;
    }
    fd_seek() {
      // wasi.ERRNO_BADF 8
      return { ret: 8, offset: 0n };
    }
    fd_write(data: Uint8Array) /*: {ret: number, nwritten: number}*/ {
      const decoded = new TextDecoder().decode(data);
      // \n to \r\n
      const fixed = decoded.replace(/\n/g, "\r\n");
      // ansi colors
      this.term.write(`\x1b[31m${fixed}\x1b[0m`);

      error_buff += fixed;

      return { ret: 0, nwritten: data.byteLength };
    }
    fd_filestat_get() {
      // wasi.ERRNO_BADF 8
      return { ret: 8, filestat: null };
    }
  }

  const toMap = (arr: Array<[string, Inode]>) => {
    const map = new Map<string, Inode>();
    for (const [key, value] of arr) {
      map.set(key, value);
    }
    return map;
  };

  const root_dir = new PreopenDirectory(
    "/",
    toMap([
      ["sysroot", new Directory([])],
      ["main.rs", rust_file],
    ]),
  );

  const farm = new WASIFarm(
    new XtermStdio(term),
    new XtermStdio(term),
    new XtermStderr(term),
    [root_dir],
  );

  callback(farm.get_ref());
};
