export type AtomicTarget = {
  name: string;
  buf: SharedArrayBuffer;
  byteOffset: number;
};

export function new_atomic_target(): AtomicTarget {
  return {
    name: "foo",
    buf: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
    byteOffset: 0,
  };
}
