import type {
  Advice,
  DescriptorFlags,
  DescriptorStat,
  DescriptorType,
  DirectoryEntry,
  ErrorCode,
  Filesize,
  LinkCount,
  MetadataHashValue,
  NewTimestamp,
  OpenFlags,
  PathFlags,
} from "../../../../output/interfaces/wasi-filesystem-types";
import type WasiFilesystemTypes from "../../../../output/interfaces/wasi-filesystem-types";
import {
  InputStream,
  type OutputStream,
  StreamErrorClosed,
  Uint8ArrayInputStream,
  min,
} from "./io";

export class DirectoryEntryStream
  implements WasiFilesystemTypes.DirectoryEntryStream
{
  readonly #iter: Iterator<DirectoryEntry, undefined, undefined>;

  constructor(iter: Iterator<DirectoryEntry, undefined, undefined>) {
    this.#iter = iter;
  }

  readDirectoryEntry(): DirectoryEntry | undefined {
    const { done, value } = this.#iter.next();
    if (done) return undefined;
    return value;
  }
}

export class Descriptor implements WasiFilesystemTypes.Descriptor {
  readonly #flags: DescriptorFlags;
  readonly #node: Node;

  constructor(flags: DescriptorFlags, node: Node) {
    this.#flags = {
      read: flags.read,
      write: flags.write,
      fileIntegritySync: flags.fileIntegritySync,
      dataIntegritySync: flags.dataIntegritySync,
      requestedWriteSync: flags.requestedWriteSync,
      mutateDirectory: flags.mutateDirectory && node.getType() === "directory",
    };
    this.#node = node;
  }

  getFlags(): DescriptorFlags {
    return this.#flags;
  }

  readViaStream(offset: Filesize): InputStream {
    if (!this.#flags.read) throw "not-permitted" as ErrorCode;
    return this.#node.readViaStream(offset);
  }

  writeViaStream(offset: Filesize): OutputStream {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    return this.#node.writeViaStream(offset);
  }

  appendViaStream(): OutputStream {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    return this.#node.appendViaStream();
  }

  advise(offset: Filesize, length: Filesize, advice: Advice): void {
    if (!this.#flags.read && !this.#flags.read)
      throw "not-permitted" as ErrorCode;
    this.#node.advise(offset, length, advice);
  }

  syncData(): void {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    this.#node.syncData();
  }

  getType(): DescriptorType {
    return this.#node.getType();
  }

  setSize(size: Filesize): void {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    this.#node.setSize(size);
  }

  setTimes(
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    this.#node.setTimes(dataAccessTimestamp, dataModificationTimestamp);
  }

  read(length: Filesize, offset: Filesize): [Uint8Array, boolean] {
    if (!this.#flags.read) throw "not-permitted" as ErrorCode;
    return this.#node.read(length, offset);
  }

  write(buffer: Uint8Array, offset: Filesize): Filesize {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    return this.#node.write(buffer, offset);
  }

  readDirectory(): DirectoryEntryStream {
    if (!this.#flags.read) throw "not-permitted" as ErrorCode;
    return this.#node.readDirectory();
  }

  sync(): void {
    if (!this.#flags.write) throw "not-permitted" as ErrorCode;
    this.#node.sync();
  }

  createDirectoryAt(path: string): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    this.#node.createDirectoryAt(path);
  }

  stat(): DescriptorStat {
    return this.#node.stat();
  }

  statAt(pathFlags: PathFlags, path: string): DescriptorStat {
    return this.#node.statAt(pathFlags, path);
  }

  setTimesAt(
    pathFlags: PathFlags,
    path: string,
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    this.#node.setTimesAt(
      pathFlags,
      path,
      dataAccessTimestamp,
      dataModificationTimestamp,
    );
  }

  linkAt(
    oldPathFlags: PathFlags,
    oldPath: string,
    newDescriptor: WasiFilesystemTypes.Descriptor,
    newPath: string,
  ): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    if (!(newDescriptor instanceof Descriptor))
      throw "cross-device" as ErrorCode;

    const node = this.#node.openAt(oldPathFlags, oldPath, {});
    newDescriptor.#node.link(node, newPath);
    node.linkCount++;
  }

  openAt(
    pathFlags: PathFlags,
    path: string,
    openFlags: OpenFlags,
    flags: DescriptorFlags,
  ): Descriptor {
    if (
      (flags.write ||
        flags.mutateDirectory ||
        openFlags.truncate ||
        openFlags.create) &&
      !this.#flags.mutateDirectory
    )
      throw "read-only" as ErrorCode;

    if (
      (flags.read && !this.#flags.read) ||
      (flags.write && !this.#flags.write) ||
      (flags.mutateDirectory && !this.#flags.mutateDirectory)
    )
      throw "not-permitted" as ErrorCode;

    return new Descriptor(flags, this.#node.openAt(pathFlags, path, openFlags));
  }

  readlinkAt(path: string): string {
    if (!this.#flags.read) throw "not-permitted" as ErrorCode;
    return this.#node.readlinkAt(path);
  }

  removeDirectoryAt(path: string): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    const node = this.#node.openAt({}, path, {});
    this.#node.removeDirectoryAt(path);
    node.linkCount--;
  }

  renameAt(
    oldPath: string,
    newDescriptor: WasiFilesystemTypes.Descriptor,
    newPath: string,
  ): void {
    if (!(newDescriptor instanceof Descriptor))
      throw "cross-device" as ErrorCode;
    if (!this.#flags.mutateDirectory || !newDescriptor.#flags.mutateDirectory)
      throw "not-permitted" as ErrorCode;
    this.#node.renameAt(oldPath, newDescriptor.#node, newPath);
  }

  symlinkAt(oldPath: string, newPath: string): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    this.#node.symlinkAt(oldPath, newPath);
  }

  unlinkFileAt(path: string): void {
    if (!this.#flags.mutateDirectory) throw "not-permitted" as ErrorCode;
    const node = this.#node.openAt({}, path, {});
    this.#node.unlinkFileAt(path);
    node.linkCount--;
  }

  isSameObject(other: WasiFilesystemTypes.Descriptor): boolean {
    if (!(other instanceof Descriptor)) return false;
    return this.#node.isSameObject(other.#node);
  }

  metadataHash(): MetadataHashValue {
    return this.#node.metadataHash();
  }

  metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue {
    return this.#node.metadataHashAt(pathFlags, path);
  }
}

export abstract class Node
  implements
    Omit<
      WasiFilesystemTypes.Descriptor,
      "getFlags" | "linkAt" | "openAt" | "renameAt" | "isSameObject"
    >
{
  linkCount: LinkCount = 0n;
  abstract size(): Filesize;

  [Symbol.iterator]?(): Iterator<DirectoryEntry, undefined, undefined>;

  abstract readViaStream(offset: Filesize): InputStream;
  abstract writeViaStream(offset: Filesize): OutputStream;
  appendViaStream(): OutputStream {
    return this.writeViaStream(this.stat().size);
  }
  advise(_offset: Filesize, _length: Filesize, _advice: Advice): void {
    // no-op
  }
  syncData(): void {
    // no-op
  }

  abstract getType(): DescriptorType;
  abstract setSize(size: Filesize): void;
  abstract setTimes(
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void;
  read(length: Filesize, offset: Filesize): [Uint8Array, boolean] {
    const stream = this.readViaStream(offset);

    const buf = (() => {
      try {
        return stream.read(length);
      } catch (e) {
        if (!(e instanceof StreamErrorClosed)) throw e;
        return undefined;
      }
    })();

    const eof =
      buf === undefined
        ? true
        : (() => {
            try {
              stream.read(0n);
              return false;
            } catch (e) {
              if (!(e instanceof StreamErrorClosed)) throw e;
              return true;
            }
          })();

    return [buf ?? new Uint8Array(), eof];
  }
  write(buffer: Uint8Array, offset: Filesize): Filesize {
    const stream = this.writeViaStream(offset);

    const n = stream.checkWrite();
    if (n === 0n) return 0n;

    const len = Number(min(n, BigInt(buffer.byteLength)));
    stream.write(buffer.subarray(0, len));

    stream.flush();
    // Wait for completion of `flush`
    stream.subscribe().block();
    // Check for any errors that arose during `flush`
    stream.checkWrite();

    return BigInt(len);
  }
  readDirectory(): DirectoryEntryStream {
    return new DirectoryEntryStream(
      this[Symbol.iterator]?.() ??
        (() => {
          throw "not-directory" satisfies ErrorCode;
        })(),
    );
  }
  sync(): void {
    // no-op
  }
  abstract createDirectoryAt(path: string): void;
  stat(): DescriptorStat {
    return {
      type: this.getType(),
      linkCount: this.linkCount,
      size: this.size(),
    };
  }
  statAt(pathFlags: PathFlags, path: string): DescriptorStat {
    return this.openAt(pathFlags, path, {}).stat();
  }
  setTimesAt(
    pathFlags: PathFlags,
    path: string,
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    this.openAt(pathFlags, path, {}).setTimes(
      dataAccessTimestamp,
      dataModificationTimestamp,
    );
  }
  abstract link(node: Node, path: string): void;
  abstract openAt(
    pathFlags: PathFlags,
    path: string,
    openFlags: OpenFlags,
  ): Node;
  readlinkAt(path: string): string {
    const link = this.openAt(
      {
        symlinkFollow: false,
      },
      path,
      {},
    );
    return new TextDecoder().decode(
      InputStream.blockingReadToEnd(link.readViaStream(0n), link.stat().size),
    );
  }
  abstract removeDirectoryAt(path: string): void;
  abstract renameAt(oldPath: string, newNode: Node, newPath: string): void;
  abstract symlinkAt(oldPath: string, newPath: string): void;
  abstract unlinkFileAt(path: string): void;
  isSameObject(other: Node): boolean {
    return this === other;
  }
  metadataHash(): MetadataHashValue {
    return {
      upper: 0n,
      lower: 0n,
    };
  }
  metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue {
    return this.openAt(pathFlags, path, {}).metadataHash();
  }
}

export abstract class Dir extends Node {
  abstract [Symbol.iterator](): Iterator<DirectoryEntry, undefined, undefined>;

  size(): Filesize {
    return 0n;
  }

  readViaStream(_offset: Filesize): InputStream {
    throw "is-directory" satisfies ErrorCode;
  }
  writeViaStream(_offset: Filesize): OutputStream {
    throw "is-directory" satisfies ErrorCode;
  }
  getType(): DescriptorType {
    return "directory";
  }
  setSize(_size: Filesize): void {
    throw "is-directory" satisfies ErrorCode;
  }
}

export abstract class File extends Node {
  getType(): DescriptorType {
    return "regular-file";
  }
  createDirectoryAt(_path: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
  link(_node: Node, _path: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
  openAt(_pathFlags: PathFlags, _path: string, _openFlags: OpenFlags): Node {
    throw "not-directory" satisfies ErrorCode;
  }
  removeDirectoryAt(_path: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
  renameAt(_oldPath: string, _newNode: Node, _newPath: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
  symlinkAt(_oldPath: string, _newPath: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
  unlinkFileAt(_path: string): void {
    throw "not-directory" satisfies ErrorCode;
  }
}

export abstract class ReadOnlyFile extends File {
  writeViaStream(_offset: Filesize): OutputStream {
    throw "read-only" satisfies ErrorCode;
  }
  setSize(_size: Filesize): void {
    throw "read-only" satisfies ErrorCode;
  }
  setTimes(
    _dataAccessTimestamp: NewTimestamp,
    _dataModificationTimestamp: NewTimestamp,
  ): void {
    throw "read-only" satisfies ErrorCode;
  }
}

export class Symlink extends ReadOnlyFile {
  #contents: Uint8Array;

  size(): Filesize {
    return BigInt(this.#contents.byteLength);
  }

  constructor(contents: string) {
    super();
    this.#contents = new TextEncoder().encode(contents);
  }

  getType(): DescriptorType {
    return "symbolic-link";
  }

  readViaStream(offset: Filesize): InputStream {
    return new Uint8ArrayInputStream(
      this.#contents.subarray(
        Number(min(BigInt(Number.MAX_SAFE_INTEGER), offset)),
      ),
    );
  }
}
