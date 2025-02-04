import type {
  ErrorCode,
  Filesize,
} from "../../../../../output/interfaces/wasi-filesystem-types";
import type WasiFilesystemTypes from "../../../../../output/interfaces/wasi-filesystem-types";
import {
  ArrayBufferOutputStream,
  type InputStream,
  type OutputStream,
  Uint8ArrayInputStream,
} from "../io";
import type {
  ReadOnlyFileDelegate,
  SymlinkDelegate,
  WritableFileDelegate,
} from "./delegate";

class ReadOnlyArrayBufferFileDelegate implements ReadOnlyFileDelegate {
  protected buffer: ArrayBuffer;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
  }

  getType(): Exclude<
    ReturnType<WasiFilesystemTypes.Descriptor["getType"]>,
    "directory"
  > {
    return "regular-file";
  }

  size(): Filesize {
    return BigInt(this.buffer.byteLength);
  }

  readViaStream(offset: Filesize): InputStream {
    if (offset > Number.MAX_SAFE_INTEGER)
      throw "invalid-seek" satisfies ErrorCode;
    return new Uint8ArrayInputStream(
      new Uint8Array(this.buffer, Number(offset)),
    );
  }
}

export class ArrayBufferFileDelegate
  extends ReadOnlyArrayBufferFileDelegate
  implements WritableFileDelegate
{
  setSize(size: Filesize): void {
    if (!this.buffer.resizable) throw "read-only" satisfies ErrorCode;
    if (size > BigInt(this.buffer.maxByteLength))
      throw "insufficient-space" satisfies ErrorCode;
    this.buffer.resize(Number(size));
  }

  writeViaStream(offset: Filesize, flush: () => void): OutputStream {
    if (!this.buffer.resizable) throw "read-only" satisfies ErrorCode;
    if (offset > Number.MAX_SAFE_INTEGER)
      throw "invalid-seek" satisfies ErrorCode;
    return new ArrayBufferOutputStream(this.buffer, Number(offset), flush);
  }
}

export class ArrayBufferSymlinkDelegate
  extends ReadOnlyArrayBufferFileDelegate
  implements SymlinkDelegate
{
  constructor(contents: string) {
    const encoded = new TextEncoder().encode(contents);
    const fixedLengthBuffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(fixedLengthBuffer).set(encoded);
    super(fixedLengthBuffer);
  }

  getType(): "symbolic-link" {
    return "symbolic-link";
  }
}

export class InputStreamFileDelegate implements ReadOnlyFileDelegate {
  protected stream: InputStream;

  constructor(stream: InputStream) {
    this.stream = stream;
  }

  getType(): Exclude<
    ReturnType<WasiFilesystemTypes.Descriptor["getType"]>,
    "directory"
  > {
    return "character-device";
  }

  size(): Filesize {
    return 0n;
  }

  readViaStream(offset: Filesize): InputStream {
    if (offset !== 0n)
      throw "invalid-seek" satisfies ErrorCode;
    return this.stream;
  }
}

export class OutputStreamFileDelegate implements WritableFileDelegate {
  protected stream: OutputStream;

  constructor(stream: OutputStream) {
    this.stream = stream;
  }

  getType(): Exclude<
    ReturnType<WasiFilesystemTypes.Descriptor["getType"]>,
    "directory"
  > {
    return "character-device";
  }

  size(): Filesize {
    return 0n;
  }

  setSize(size: Filesize): void {
    if (size !== 0n) {
      throw "invalid" satisfies ErrorCode;
    }
  }

  readViaStream(_offset: Filesize): InputStream {
    throw "invalid" satisfies ErrorCode;
  }

  writeViaStream(offset: Filesize): OutputStream {
    if (offset !== 0n) {
      throw "invalid-seek" satisfies ErrorCode;
    }
    return this.stream;
  }
}
