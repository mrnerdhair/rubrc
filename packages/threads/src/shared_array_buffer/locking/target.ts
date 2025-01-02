export type AtomicTarget = {
  buf: SharedArrayBuffer;
  byteOffset: number;
};

export function new_atomic_target(): AtomicTarget {
  return {
    buf: new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT),
    byteOffset: 0,
  };
}
