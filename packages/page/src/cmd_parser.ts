import type { Terminal } from "rubrc-util";
import type { MainWorker } from "./worker_process/worker";

export const parser_setup = (
  terminal: Terminal,
  main_worker_promise: Promise<MainWorker>,
) => {
  return async (...args: string[]) => {
    const main_worker = await main_worker_promise;

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
      terminal.write("executing rustc...\r\n");
      await main_worker.rustc(...args.slice(1));
    } else if (cmd === "clang") {
      console.log("clang");
      terminal.write("executing clang...\r\n");
      await main_worker.llvm(...args.slice());
    } else if (cmd === "llvm") {
      console.log("llvm");
      terminal.write("executing llvm...\r\n");
      await main_worker.llvm(...args.slice());
    } else if (llvm_tools.includes(cmd)) {
      console.log("llvm");
      terminal.write("executing llvm...\r\n");
      await main_worker.llvm(...["llvm", ...args.slice()]);
    } else if (cmd === "echo") {
      console.log("echo");
      terminal.write(`${args.slice(1).join(" ")}\r\n`);
    } else if (cmd === "ls") {
      console.log("ls");
      terminal.write("executing ls...\r\n");
      await main_worker.ls(...args.slice(1));
    } else if (cmd === "tree") {
      console.log("tree");
      terminal.write("executing tree...\r\n");
      await main_worker.tree(...args.slice(1));
    } else if (cmd === "download") {
      console.log("download: ", args[1]);
      if (args[1].includes("/")) {
        terminal.write("executing download...\r\n");
        await main_worker.download(args[1]);
      } else {
        terminal.write("download require absolute path\r\n");
      }
    } else if (cmd.includes("/")) {
      console.log("cmd includes /");
      terminal.write("executing file...\r\n");
      await main_worker.exec_file(...args);
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
      terminal.write(
        `command not found: ${cmd}\r\navailable commands: ${cmd_list.join(", ")}\r\n`,
      );
    }
    terminal.write(">");
  };
};
