import type { ErrorCode } from "../../../../output/interfaces/wasi-filesystem-types";
import type WasiIoError from "../../../../output/interfaces/wasi-io-error";
import type WasiIoStreams from "../../../../output/interfaces/wasi-io-streams";

export const min = <T extends number | bigint>(x: T, y: T) => (x < y ? x : y);

export type Variant<T extends string = string, U = never> = {
  [K in "tag" | (U extends never ? never : "val")]: {
    tag: T;
    val: U;
  }[K];
};

export abstract class StreamError implements Variant {
  abstract readonly tag: string;
}

export class StreamErrorClosed
  extends StreamError
  implements WasiIoStreams.StreamErrorClosed, Variant<"closed">
{
  readonly tag = "closed";
}

export class StreamErrorLastOperationFailed
  extends StreamError
  implements
    WasiIoStreams.StreamErrorLastOperationFailed,
    Variant<"last-operation-failed", WasiIoError.Error>
{
  readonly tag = "last-operation-failed";
  readonly val: WasiIoError.Error;

  constructor(error: Error | WasiIoError.Error) {
    super();
    this.val = "toDebugString" in error ? error : new IoError(error);
  }
}

export class IoError implements WasiIoError.Error {
  #error: Error;
  constructor(error: Error) {
    this.#error = error;
  }
  toDebugString(): string {
    return this.#error.message;
  }
}

export abstract class InputStream implements WasiIoStreams.InputStream {
  abstract readonly ready: boolean;

  abstract read(len: bigint): Uint8Array;
  blockingRead(len: bigint): Uint8Array {
    this.subscribe().block();
    return this.read(len);
  }
  skip(len: bigint): bigint {
    return BigInt(this.read(len).byteLength);
  }
  blockingSkip(len: bigint): bigint {
    this.subscribe().block();
    return this.skip(len);
  }
  subscribe(): Pollable {
    return new InputStreamPollable(this);
  }

  static blockingReadToEnd(stream: InputStream, len: bigint): Uint8Array {
    const maxByteLength = Number(min(len, 2n ** 32n));
    const buf = new Uint8Array(new ArrayBuffer(0, { maxByteLength }));
    let offset = 0;
    while (offset < maxByteLength) {
      try {
        const chunk = stream.blockingRead(BigInt(maxByteLength - offset));
        buf.subarray(offset).set(chunk);
        offset += chunk.byteLength;
      } catch (e) {
        if (!(e instanceof StreamErrorClosed)) throw e;
        break;
      }
    }
    return buf;
  }
}

export abstract class OutputStream implements WasiIoStreams.OutputStream {
  abstract checkWrite(): bigint;
  abstract write(contents: Uint8Array): void;
  blockingWriteAndFlush(contents: Uint8Array): void {
    let contentsLeft = contents;
    const pollable = this.subscribe();
    while (contentsLeft.byteLength !== 0) {
      // Wait for the stream to become writable
      pollable.block();
      const n = this.checkWrite();
      const len = Number(min(n, BigInt(contentsLeft.byteLength)));
      const chunk = contentsLeft.subarray(0, len);
      const rest = contentsLeft.subarray(len);
      this.write(chunk);
      contentsLeft = rest;
    }
    this.flush();
    // Wait for completion of `flush`
    pollable.block();
    // Check for any errors that arose during `flush`
    this.checkWrite();
  }
  flush(): void {
    // no-op
  }
  blockingFlush(): void {
    const pollable = this.subscribe();
    this.flush();
    pollable.block();
    // Check for any errors that arose during `flush`
    this.checkWrite();
  }
  subscribe(): Pollable {
    return new OutputStreamPollable(this);
  }
  writeZeroes(len: bigint): void {
    let zeroesLeft = len;
    while (zeroesLeft > 0n) {
      const num = min(zeroesLeft, 2n ** 32n);
      this.write(new Uint8Array(Number(num)));
      zeroesLeft -= num;
    }
  }
  blockingWriteZeroesAndFlush(len: bigint): void {
    let numZeroes = len;
    const pollable = this.subscribe();
    while (numZeroes > 0n) {
      // Wait for the stream to become writable
      pollable.block();
      const n = this.checkWrite();
      const len = min(n, numZeroes);
      this.writeZeroes(len);
      numZeroes -= len;
    }
    this.flush();
    // Wait for completion of `flush`
    pollable.block();
    // Check for any errors that arose during `flush`
    this.checkWrite();
  }
  splice(src: InputStream, len: bigint): bigint {
    const n = min(this.checkWrite(), len);
    this.write(src.read(n));
    return n;
  }
  blockingSplice(src: InputStream, len: bigint): bigint {
    Pollable.poll([this.subscribe(), src.subscribe()]);
    return this.splice(src, len);
  }
}

export abstract class Pollable implements WasiIoStreams.Pollable {
  abstract ready(): boolean;

  block(): void {
    Pollable.poll([this]);
  }

  static async poll(in_: Array<Pollable>): Promise<Uint32Array> {
    const current = in_.flatMap((x, i) => (x.ready() ? [i] : []));
    if (current.length > 0) return new Uint32Array(current);

    // Best we can do in a synchronous function...
    throw new Error("no pollables are ready");
  }
}

export class OutputStreamPollable extends Pollable {
  #stream: OutputStream;

  constructor(stream: OutputStream) {
    super();
    this.#stream = stream;
  }

  ready(): boolean {
    return this.#stream.checkWrite() > 0n;
  }
}

export class InputStreamPollable extends Pollable {
  #stream: InputStream;

  constructor(stream: InputStream) {
    super();
    this.#stream = stream;
  }

  ready(): boolean {
    return this.#stream.ready;
  }
}

export class Uint8ArrayInputStream extends InputStream {
  #buf: Uint8Array | undefined;

  constructor(buf: Uint8Array | undefined) {
    super();
    this.#buf = buf;
  }

  get ready(): boolean {
    return this.#buf === undefined || this.#buf.byteLength > 0;
  }

  read(len: bigint): Uint8Array {
    if (this.#buf === undefined) throw { tag: "closed" } satisfies StreamError;
    const n = Number(min(len, 2n ** 32n));
    const chunk = this.#buf.subarray(0, n);
    this.#buf = this.#buf.subarray(n);
    if (this.#buf.byteLength === 0) this.#buf = undefined;
    return chunk;
  }
}

export class ArrayBufferOutputStream extends OutputStream {
  buffer: ArrayBuffer;

  constructor(buffer: ArrayBuffer) {
    super();
    this.buffer = buffer;
  }

  checkWrite(): bigint {
    const out = BigInt(this.buffer.maxByteLength - this.buffer.byteLength);
    if (out === 0n) throw "insufficient-space" satisfies ErrorCode;
    return out;
  }

  write(contents: Uint8Array): void {
    const offset = this.buffer.byteLength;
    this.buffer.resize(this.buffer.byteLength + contents.byteLength);
    new Uint8Array(this.buffer).set(contents, offset);
  }
}
