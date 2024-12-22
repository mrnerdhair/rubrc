import type { WASIFarmRefUseArrayBufferObject } from "@oligami/browser_wasi_shim-threads";
import { Suspense, createSignal, lazy } from "solid-js";
import { DownloadButton, RunButton } from "./btn";
import { default_value, rust_file } from "./config";
import type { Ctx } from "./ctx";
import { triples } from "./sysroot";
import { SetupMyTerminal } from "./xterm";

const Select = lazy(async () => {
  const selector = import("@thisbeyond/solid-select");
  const css_load = import("@thisbeyond/solid-select/style.css");

  const [mod] = await Promise.all([selector, css_load]);

  return { default: mod.Select };
});

import { SharedObjectRef } from "@oligami/shared-object";
const MonacoEditor = lazy(() =>
  import("solid-monaco").then((mod) => ({ default: mod.MonacoEditor })),
);

const App = (props: {
  ctx: Ctx;
  callback: (wasi_ref: WASIFarmRefUseArrayBufferObject) => void;
}) => {
  const handleMount = (_monaco: unknown, _editor: unknown) => {
    // Use monaco and editor instances here
  };
  const handleEditorChange = (value: string) => {
    // Handle editor value change
    rust_file.data = new TextEncoder().encode(value);
  };
  const load_additional_sysroot = (value: string) => {
    const load_additional_sysroot = new SharedObjectRef(
      props.ctx.load_additional_sysroot_id,
    ).proxy<(x: string) => void>();
    load_additional_sysroot(value);
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
        <SetupMyTerminal ctx={props.ctx} callback={props.callback} />
      </div>
      <div class="flex">
        <div class="p-4 text-white">
          <RunButton triple={triple()} />
        </div>
        <div class="p-4 text-white" style={{ width: "60vw" }}>
          <Select
            options={triples}
            class="text-4xl text-green-700"
            onChange={(value) => {
              console.log(value);
              setTriple(value);
              load_additional_sysroot(value);
            }}
          />
        </div>
        <div class="p-4 text-white">
          <DownloadButton />
        </div>
      </div>
    </div>
  );
};

export default App;
