export type WasiP1Thread = WebAssembly.Instance & {
  exports: {
    memory: WebAssembly.Memory;
    wasi_thread_start: (thread_id: number, start_arg: number) => void;
  };
};

export function is_wasi_p1_thread(
  value: WebAssembly.Instance,
): value is WasiP1Thread {
  return (
    "memory" in value.exports &&
    value.exports.memory instanceof WebAssembly.Memory &&
    "wasi_thread_start" in value.exports &&
    typeof value.exports.wasi_thread_start === "function"
  );
}

export function assert_wasi_p1_thread(
  value: WebAssembly.Instance,
): asserts value is WasiP1Thread {
  if (!is_wasi_p1_thread(value)) throw new Error("expected WASI P1 command");
}

export function as_wasi_p1_thread(value: WebAssembly.Instance): WasiP1Thread {
  assert_wasi_p1_thread(value);
  return value;
}
