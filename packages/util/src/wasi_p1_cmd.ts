export type WasiP1Cmd = WebAssembly.Instance & {
  exports: {
    memory: WebAssembly.Memory;
    _start: () => unknown;
    _initialize?: never;
  };
};

export function is_wasi_p1_cmd(
  value: WebAssembly.Instance,
): value is WasiP1Cmd {
  return (
    "memory" in value.exports &&
    value.exports.memory instanceof WebAssembly.Memory &&
    "_start" in value.exports &&
    typeof value.exports._start === "function" &&
    !("_initialize" in value.exports)
  );
}

export function assert_wasi_p1_cmd(
  value: WebAssembly.Instance,
): asserts value is WasiP1Cmd {
  if (!is_wasi_p1_cmd(value)) throw new Error("expected WASI P1 command");
}

export function as_wasi_p1_cmd(value: WebAssembly.Instance): WasiP1Cmd {
  assert_wasi_p1_cmd(value);
  return value;
}
