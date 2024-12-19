import { SharedObject, SharedObjectRef } from "@oligami/shared-object";
import type { Ctx } from "./ctx";

// @ts-expect-error
let waiter: SharedObject;
let is_all_done = false;
let is_cmd_run_end = true;
let end_of_exec = false;
let is_rustc_fetch_end = false;

type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (result: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

export const parser_setup = async (ctx: Ctx) => {
  const n = 1;

  const resolvers: PromiseWithResolvers<void>[] = [];
  for (let i = 0; i < n; i++) {
    resolvers.push(
      (() => {
        let resolve: () => void;
        let reject: (reason?: unknown) => void;
        const promise = new Promise<void>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        // biome-ignore lint/style/noNonNullAssertion: both set in promise constructor
        return { promise, resolve: resolve!, reject: reject! };
      })(),
    );
  }

  waiter = new SharedObject(
    {
      rustc: () => {
        resolvers[0].resolve();
      },
      end_rustc_fetch: () => {
        is_rustc_fetch_end = true;
      },
      is_rustc_fetch_end: () => {
        return is_rustc_fetch_end;
      },
      is_all_done: (): boolean => {
        return is_all_done;
      },
      is_cmd_run_end: () => {
        return is_cmd_run_end;
      },
      set_end_of_exec: (_end_of_exec: boolean) => {
        end_of_exec = _end_of_exec;
      },
    },
    ctx.waiter_id,
  );

  await Promise.all(resolvers.map((r) => r.promise));

  is_all_done = true;

  await all_done(ctx);
};

const all_done = async (ctx: Ctx) => {
  const rustc = new SharedObjectRef(ctx.rustc_id).proxy<
    (...args: string[]) => Promise<void>
  >();
  const terminal = new SharedObjectRef(ctx.terminal_id).proxy<
    (x: string) => Promise<void>
  >();
  const ls = new SharedObjectRef(ctx.ls_id).proxy<
    (...args: string[]) => Promise<void>
  >();
  const tree = new SharedObjectRef(ctx.tree_id).proxy<
    (...args: string[]) => Promise<void>
  >();
  const exec_file = new SharedObjectRef(ctx.exec_file_id).proxy<
    (...args: string[]) => Promise<void>
  >();
  const download = new SharedObjectRef(ctx.download_id).proxy<
    (x: string) => Promise<void>
  >();
  const clang = new SharedObjectRef(ctx.llvm_id).proxy<
    (...args: string[]) => Promise<void>
  >();

  // cmd_parser
  new SharedObject((...args: string[]) => {
    is_cmd_run_end = false;
    (async (args: string[]) => {
      console.log(args);

      const cmd = args[0];

      console.log(cmd);

      const llvm_tools = [
        "symbolizer",
        "addr2line",
        "size",
        "objdump",
        "otool",
        "objcopy",
        "install-name-tool",
        "bitcode-strip",
        "strip",
        "cxxfilt",
        "c++filt",
        "ar",
        "ranlib",
        "lib",
        "dlltool",
        "lld",
        "lld-link",
        "ld.lld",
        "ld64.lld",
        "wasm-ld",
        "ld",
        "clang",
        "clang",
        "clang++",
      ];

      if (cmd === "rustc") {
        console.log("rustc");
        await terminal("executing rustc...\r\n");
        await rustc(...args.slice(1));
      } else if (cmd === "clang") {
        console.log("clang");
        await terminal("executing clang...\r\n");
        await clang(...args.slice());
      } else if (cmd === "llvm") {
        console.log("llvm");
        await terminal("executing llvm...\r\n");
        await clang(...args.slice());
      } else if (llvm_tools.includes(cmd)) {
        console.log("llvm");
        await terminal("executing llvm...\r\n");
        await clang(...["llvm", ...args.slice()]);
      } else if (cmd === "echo") {
        console.log("echo");
        await terminal(`${args.slice(1).join(" ")}\r\n`);
      } else if (cmd === "ls") {
        console.log("ls");
        await terminal("executing ls...\r\n");
        await ls(...args.slice(1));
      } else if (cmd === "tree") {
        console.log("tree");
        await terminal("executing tree...\r\n");
        await tree(...args.slice(1));
      } else if (cmd === "download") {
        console.log("download: ", args[1]);
        if (args[1].includes("/")) {
          await terminal("executing download...\r\n");
          end_of_exec = false;
          await download(args[1]);
          while (!end_of_exec) {
            await new Promise<void>((resolve) => setTimeout(resolve, 100));
          }
        } else {
          await terminal("download require absolute path\r\n");
        }
      } else if (cmd.includes("/")) {
        console.log("cmd includes /");
        await terminal("executing file...\r\n");
        end_of_exec = false;
        await exec_file(...args);
        while (!end_of_exec) {
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }
      } else {
        const cmd_list = [
          "rustc",
          "clang",
          "llvm",
          "echo",
          "ls",
          "tree",
          "download",
          ...llvm_tools,
        ];
        await terminal(
          `command not found: ${cmd}\r\navailable commands: ${cmd_list.join(", ")}\r\n`,
        );
      }
      await terminal(">");
      is_cmd_run_end = true;
    })(args);
  }, ctx.cmd_parser_id);

  await terminal("rustc -h\r\n");
  await rustc("-h");
  await terminal(">");
};
