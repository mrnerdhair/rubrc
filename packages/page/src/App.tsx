import type { WASIFarmRefUseArrayBufferObject } from "@oligami/browser_wasi_shim-threads";
import type { CmdParser, Terminal } from "rubrc-util";
import { Suspense, createSignal, lazy } from "solid-js";
import { DownloadButton, RunButton } from "./btn";
import type { CompileAndRun } from "./compile_and_run";
import { default_value, rust_file } from "./config";
import { triples } from "./sysroot";
import { SetupMyTerminal } from "./xterm";

const Select = lazy(async () => {
  const selector = import("@thisbeyond/solid-select");
  const css_load = import("@thisbeyond/solid-select/style.css");

  const [mod] = await Promise.all([selector, css_load]);

  return { default: mod.Select };
});

const MonacoEditor = lazy(() =>
  import("solid-monaco").then((mod) => ({ default: mod.MonacoEditor })),
);

const App = (props: {
  cmd_parser: CmdParser;
  compile_and_run: Promise<CompileAndRun>;
  load_additional_sysroot_callback: (value: string) => void;
  terminal_callback: (value: Terminal) => void;
  terminal_wasi_ref_callback: (value: WASIFarmRefUseArrayBufferObject) => void;
}) => {
  const handleMount = (_monaco: unknown, _editor: unknown) => {
    // Use monaco and editor instances here
  };
  const handleEditorChange = (value: string) => {
    // Handle editor value change
    rust_file.data = new TextEncoder().encode(value);
  };
  const [triple, setTriple] = createSignal("wasm32-wasip1");

  return (
    <div>
      <Suspense
        fallback={
          <div
            class="p-4 text-white"
            style={{ width: "100vw", height: "30vh" }}
          >
            <p class="text-4xl text-green-700 text-center">Loading editor...</p>
          </div>
        }
      >
        <MonacoEditor
          language="rust"
          value={default_value}
          height="30vh"
          onMount={handleMount}
          onChange={handleEditorChange}
        />
      </Suspense>
      {/* <p class="text-4xl text-green-700 text-center">Hello tailwind!</p> */}
      <div class="flex" style={{ width: "100vw" }}>
        <SetupMyTerminal
          cmd_parser={props.cmd_parser}
          terminal_callback={props.terminal_callback}
          terminal_wasi_ref_callback={props.terminal_wasi_ref_callback}
        />
      </div>
      <div class="flex">
        <div class="p-4 text-white">
          <RunButton
            callback={async () => {
              (await props.compile_and_run).compile_and_run(triple());
            }}
          />
        </div>
        <div class="p-4 text-white" style={{ width: "60vw" }}>
          <Select
            options={triples}
            initialValue={triple()}
            class="text-4xl text-green-700"
            onChange={(value) => {
              console.log(value);
              setTriple(value);
              props.load_additional_sysroot_callback(value);
            }}
          />
        </div>
        <div class="p-4 text-white">
          <DownloadButton
            callback={async () => {
              (await props.compile_and_run).download("/tmp/main.wasm");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
