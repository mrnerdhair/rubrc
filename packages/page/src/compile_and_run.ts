import type { CmdParser, Terminal } from "rubrc-util";

export class CompileAndRun {
  private readonly cmd_parser: CmdParser;
  private readonly terminal: Terminal;

  constructor(
    cmd_parser: (...args: string[]) => Promise<void>,
    terminal: Terminal,
  ) {
    this.cmd_parser = cmd_parser;
    this.terminal = terminal;
  }

  async download_by_url(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name; // Specify the file name when downloading
    document.body.appendChild(a); // Add to DOM
    a.click(); // Click to start download
    document.body.removeChild(a); // Delete immediately
  }

  async compile_and_run(triple: string) {
    const exec = [
      "rustc",
      "/main.rs",
      "--sysroot",
      "/sysroot",
      "--target",
      triple,
      "--out-dir",
      "/tmp",
      "-Ccodegen-units=1",
    ];
    if (triple === "wasm32-wasip1") {
      exec.push("-Clinker-flavor=wasm-ld");
      exec.push("-Clinker=wasm-ld");
    } else {
      // exec.push("-Zunstable-options");
      // exec.push("-Clinker-flavor=gnu");
      exec.push("-Clinker=lld");

      await this.terminal.reset_err_buff();
    }
    await this.terminal.write(`${exec.join(" ")}\r\n`);
    await this.cmd_parser(...exec);

    if (triple === "wasm32-wasip1") {
      await this.terminal.write("/tmp/main.wasm\r\n");
      await this.cmd_parser("/tmp/main.wasm");
    } else if (triple === "x86_64-pc-windows-gnu") {
      const err_msg = await this.terminal.get_out_buff();
      console.log("err_msg: ", err_msg);

      const lld_args_and_etc = err_msg
        .split("\r\n")
        .find((line) => line.includes("Linking using"));
      if (!lld_args_and_etc) {
        throw new Error("cannot get lld arguments");
      }

      // split by space
      const lld_args_str = lld_args_and_etc
        .split(' "')
        ?.slice(1)
        .map((arg) => arg.slice(0, -1));

      // first args to lld-link
      const clang_args = lld_args_str;
      clang_args[0] = "lld-link";

      // // add -fuse-ld=lld
      // clang_args.push("-fuse-ld=lld");

      await this.terminal.write(`${clang_args.join(" ")}\r\n`);
      await this.cmd_parser(...clang_args);
    } else {
      await this.terminal.write("download /tmp/main\r\n");
      await this.cmd_parser("download", "/tmp/main");
    }
  }

  async download(file: string) {
    console.log("download");
    await this.terminal.write(`download ${file}\r\n`);
    await this.cmd_parser("download", file);
  }
}
