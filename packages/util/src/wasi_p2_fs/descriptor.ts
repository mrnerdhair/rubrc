import type {
  Advice,
  DescriptorFlags,
  DescriptorStat,
  DescriptorType,
  ErrorCode,
  Filesize,
  MetadataHashValue,
  NewTimestamp,
  OpenFlags,
  PathFlags,
} from "../../../../output/interfaces/wasi-filesystem-types";
import type WasiFilesystemTypes from "../../../../output/interfaces/wasi-filesystem-types";
import type { DirectoryEntryStream } from "./directory_entry_stream";
import type { InputStream, OutputStream } from "./io";
import type { DirectoryDelegate, Node } from "./node";

export class Descriptor implements WasiFilesystemTypes.Descriptor {
  readonly flags: DescriptorFlags;
  readonly node: Node;

  constructor(flags: DescriptorFlags, node: Node) {
    this.flags = {
      read: flags.read,
      write: flags.write,
      fileIntegritySync: flags.fileIntegritySync,
      dataIntegritySync: flags.dataIntegritySync,
      requestedWriteSync: flags.requestedWriteSync,
      mutateDirectory: flags.mutateDirectory && node.getType() === "directory",
    };
    this.node = node;
  }

  getFlags(): DescriptorFlags {
    return this.flags;
  }

  readViaStream(offset: Filesize): InputStream {
    if (!this.flags.read) throw "not-permitted" satisfies ErrorCode;
    return this.node.readViaStream(offset);
  }

  writeViaStream(offset: Filesize): OutputStream {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    return this.node.writeViaStream(offset);
  }

  appendViaStream(): OutputStream {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    return this.node.appendViaStream();
  }

  advise(offset: Filesize, length: Filesize, advice: Advice): void {
    if (!this.flags.read && !this.flags.read)
      throw "not-permitted" satisfies ErrorCode;
    this.node.advise(offset, length, advice);
  }

  syncData(): void {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    this.node.syncData();
  }

  getType(): DescriptorType {
    return this.node.getType();
  }

  setSize(size: Filesize): void {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    this.node.setSize(size);
  }

  setTimes(
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    this.node.setTimes(dataAccessTimestamp, dataModificationTimestamp);
  }

  read(length: Filesize, offset: Filesize): [Uint8Array, boolean] {
    if (!this.flags.read) throw "not-permitted" satisfies ErrorCode;
    return this.node.read(length, offset);
  }

  write(buffer: Uint8Array, offset: Filesize): Filesize {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    return this.node.write(buffer, offset);
  }

  readDirectory(): DirectoryEntryStream {
    if (!this.flags.read) throw "not-permitted" satisfies ErrorCode;
    return this.node.readDirectory();
  }

  sync(): void {
    if (!this.flags.write) throw "not-permitted" satisfies ErrorCode;
    this.node.sync();
  }

  createDirectoryAt(path: string): void {
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    this.node.createDirectoryAt(path);
  }

  stat(): DescriptorStat {
    return this.node.stat();
  }

  statAt(pathFlags: PathFlags, path: string): DescriptorStat {
    return this.node.statAt(pathFlags, path);
  }

  setTimesAt(
    pathFlags: PathFlags,
    path: string,
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    this.node.setTimesAt(
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
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    if (!(newDescriptor instanceof Descriptor))
      throw "cross-device" satisfies ErrorCode;

    this.node.linkAt(oldPathFlags, oldPath, newDescriptor.node, newPath);
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
      !this.flags.mutateDirectory
    )
      throw "read-only" satisfies ErrorCode;

    if (
      (flags.read && !this.flags.read) ||
      (flags.write && !this.flags.write) ||
      (flags.mutateDirectory && !this.flags.mutateDirectory)
    )
      throw "not-permitted" satisfies ErrorCode;

    return new Descriptor(flags, this.node.openAt(pathFlags, path, openFlags));
  }

  readlinkAt(path: string): string {
    if (!this.flags.read) throw "not-permitted" satisfies ErrorCode;
    return this.node.readlinkAt(path);
  }

  removeDirectoryAt(path: string): void {
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    this.node.removeDirectoryAt(path);
  }

  renameAt(
    oldPath: string,
    newDescriptor: WasiFilesystemTypes.Descriptor,
    newPath: string,
  ): void {
    if (!(newDescriptor instanceof Descriptor))
      throw "cross-device" satisfies ErrorCode;
    if (!this.flags.mutateDirectory || !newDescriptor.flags.mutateDirectory)
      throw "not-permitted" satisfies ErrorCode;
    const newNode = newDescriptor.node;
    if (newNode.getType() !== "directory")
      throw "not-directory" satisfies ErrorCode;
    this.node.renameAt(oldPath, newNode as Node<DirectoryDelegate>, newPath);
  }

  symlinkAt(oldPath: string, newPath: string): void {
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    this.node.symlinkAt(oldPath, newPath);
  }

  unlinkFileAt(path: string): void {
    if (!this.flags.mutateDirectory) throw "not-permitted" satisfies ErrorCode;
    this.node.unlinkFileAt(path);
  }

  isSameObject(other: WasiFilesystemTypes.Descriptor): boolean {
    if (!(other instanceof Descriptor)) return false;
    return this.node.isSameObject(other.node);
  }

  metadataHash(): MetadataHashValue {
    return this.node.metadataHash();
  }

  metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue {
    return this.node.metadataHashAt(pathFlags, path);
  }
}
