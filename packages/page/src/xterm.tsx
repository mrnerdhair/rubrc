import {
  Directory,
  Fd,
  type Inode,
  PreopenDirectory,
} from "@bjorn3/browser_wasi_shim";
import {
  WASIFarm,
  type WASIFarmRefUseArrayBufferObject,
} from "@oligami/browser_wasi_shim-threads";
import { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import type { CmdParser, Terminal as OtherTerminal } from "rubrc-util";
import { rust_file } from "./config";
import XTerm from "./solid_xterm";

// Supress an annoyingly intermittent TS bug that makes this a WorkerNavigator
declare const navigator: Navigator;

const makeTerminal = (xterm: Promise<Terminal>): OtherTerminal => {
  let err_buff = "";
  let out_buff = "";
  return {
    write: (str: string) => {
      xterm.then((xterm) => xterm.write(str));
    },
    get_err_buff: () => {
      console.log("called get_err_buff");
      return err_buff;
    },
    reset_err_buff: () => {
      err_buff = "";
    },
    append_err_buff: (value: string) => {
      err_buff += value;
    },
    get_out_buff: () => {
      console.log("called get_out_buff");
      return out_buff;
    },
    reset_out_buff: () => {
      out_buff = "";
    },
    append_out_buff: (value: string) => {
      out_buff += value;
    },
  };
};

export const SetupMyTerminal = (props: {
  cmd_parser: CmdParser;
  terminal_callback: (value: OtherTerminal) => void;
  terminal_wasi_ref_callback: (
    wasi_ref: WASIFarmRefUseArrayBufferObject,
  ) => void;
}) => {
  const fit_addon = new FitAddon();

  const { promise: xterm, resolve: set_xterm } =
    Promise.withResolvers<Terminal>();
  const write_terminal = makeTerminal(xterm);

  (async () => {
    props.terminal_callback(write_terminal);
    props.terminal_wasi_ref_callback(get_ref(await xterm, write_terminal));
  })();

  const handleMount = (terminal: Terminal) => {
    set_xterm(terminal);
    fit_addon.fit();
    return () => {
      console.log("Terminal unmounted.");
    };
  };

  let keys = "";

  let before_cmd = "";
  const on_enter = async (terminal: Terminal) => {
    before_cmd = keys;
    terminal.write("\r\n");
    const parsed = keys.split(" ");
    await props.cmd_parser(...parsed);
    keys = "";
  };
  const keydown = (
    event: { key: string; domEvent: KeyboardEvent },
    terminal: Terminal,
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

const get_ref = (
  term: Terminal,
  other_term: OtherTerminal,
): WASIFarmRefUseArrayBufferObject => {
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

      other_term.append_out_buff(fixed);

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

      other_term.append_err_buff(fixed);

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

  return farm.get_ref();
};
