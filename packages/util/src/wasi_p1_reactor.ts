export type WasiP1Reactor = WebAssembly.Instance & {
  exports: {
    memory: WebAssembly.Memory;
    _start?: never;
    _initialize?: () => unknown;
  };
};

export function is_wasi_p1_reactor(
  value: WebAssembly.Instance,
): value is WasiP1Reactor {
  return (
    "memory" in value.exports &&
    value.exports.memory instanceof WebAssembly.Memory &&
    !("_start" in value.exports)
  );
}

export function assert_wasi_p1_reactor(
  value: WebAssembly.Instance,
): asserts value is WasiP1Reactor {
  if (!is_wasi_p1_reactor(value)) throw new Error("expected WASI P1 reactor");
}

export function as_wasi_p1_reactor(value: WebAssembly.Instance): WasiP1Reactor {
  assert_wasi_p1_reactor(value);
  return value;
}
