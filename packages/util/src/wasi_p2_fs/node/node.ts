import type {
  Advice,
  Datetime,
  DescriptorStat,
  DescriptorType,
  ErrorCode,
  Filesize,
  LinkCount,
  MetadataHashValue,
  NewTimestamp,
  OpenFlags,
  PathFlags,
} from "../../../../../output/interfaces/wasi-filesystem-types";
import type WasiFilesystemTypes from "../../../../../output/interfaces/wasi-filesystem-types";
import { validate } from "../../decorators/validate";
import { DirectoryEntryStream } from "../directory_entry_stream";
import { InputStream, type OutputStream, StreamErrorClosed } from "../io";
import { min } from "../util";
import type {
  DirectoryDelegate,
  NodeDelegate,
  WritableDirectoryDelegate,
} from "./delegate";

export class Node<TDelegate extends NodeDelegate = NodeDelegate>
  implements
    Omit<
      WasiFilesystemTypes.Descriptor,
      "getFlags" | "linkAt" | "openAt" | "renameAt" | "isSameObject"
    >
{
  private readonly delegate: TDelegate;

  private dataAccessTimestamp: Datetime | undefined;
  private dataModificationTimestamp: Datetime | undefined;
  private statusChangeTimestamp: Datetime | undefined;

  private linkCount: LinkCount = 0n;

  static now: (this: void) => Datetime | undefined = () => {
    const nowMs = Date.now();
    return {
      seconds: BigInt(nowMs) / 1000n,
      nanoseconds: (nowMs % 1000) * 1_000_000,
    };
  };

  @validate((value: number) => {
    if (value < 0) throw new Error("SYMLOOP_MAX must be nonnegative");
    if (value < 8) console.warn("POSIX wants a SYMLOOP_MAX of at least 8");
  })
  static accessor SYMLOOP_MAX = Number.POSITIVE_INFINITY;

  constructor(
    delegate: TDelegate,
    dataAccessTimestamp?: Datetime,
    dataModificationTimestamp?: Datetime,
    statusChangeTimestamp?: Datetime,
  ) {
    this.delegate = delegate;
    this.dataAccessTimestamp = dataAccessTimestamp;
    this.dataModificationTimestamp = dataModificationTimestamp;
    this.statusChangeTimestamp = statusChangeTimestamp;
  }

  #isDirectory(): this is Node<DirectoryDelegate> {
    return this.getType() === "directory";
  }

  #isWritableDirectory(): this is Node<WritableDirectoryDelegate> {
    return this.#isDirectory() && this.delegate.link !== undefined;
  }

  #linkCountIncrement() {
    const now = Node.now();
    this.linkCount++;
    if (now !== undefined) this.statusChangeTimestamp = now;
  }

  #linkCountDecrement() {
    const now = Node.now();
    this.linkCount--;
    if (now !== undefined) this.statusChangeTimestamp = now;
  }

  #updateMtime() {
    const now = Node.now();
    if (now !== undefined) {
      this.dataModificationTimestamp = now;
      this.statusChangeTimestamp = now;
    }
  }

  // @ts-expect-error TS has a bug which emits a TS6133 error here. (Something to do with the private name.)
  #newNode<TDelegate extends NodeDelegate>(
    delegate: TDelegate,
  ): Node<TDelegate> {
    const now = Node.now();
    return new Node(delegate, now, now, now);
  }

  #resolve(
    pathFlags: PathFlags,
    path: string,
  ): { parent: Node<DirectoryDelegate>; name: string | undefined } {
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;

    const { symlinkFollow } = pathFlags;

    const normalized = [];

    let expandedPath: string | undefined = path;
    if (symlinkFollow) {
      while (this.statAt({}, expandedPath).type === "symbolic-link") {
        const contents = this.readlinkAt(expandedPath);
        // absolute symlinks can't be resolved in WASI. that makes this a broken link, which we won't resolve further.
        if (contents.startsWith("/")) break;
        // hack; wouldn't work with POSIX semantics
        expandedPath += `/../${contents}`;
      }
    }

    // This isn't *quite* POSIX. Note for example that /foo/../bar will resolve even if /foo isn't a directory.
    // /foo/. will also resolve, even if /foo isn't a directory. /foo/bar/.. will also resolve even if /foo/bar
    // doesn't exist. These issues are, broadly speaking, in common with Node.js's path.normalize().
    //
    // (Eventually, full POSIX correctness is intended here. The API contract should make no guarantees about
    // these incorrect behaviors.)
    for (const segment of expandedPath.split("/")) {
      switch (segment) {
        case "":
        case ".": {
          break;
        }
        case "..": {
          if (normalized.length === 0) throw "access" satisfies ErrorCode;
          normalized.pop();
          break;
        }
        default: {
          normalized.push(segment);
        }
      }
    }

    const first = normalized.shift();
    if (first === undefined) return { parent: this, name: undefined };

    return normalized.reduce<{ parent: Node<DirectoryDelegate>; name: string }>(
      (a, x) => {
        const newParent = a.parent.#open(a.name, {});
        if (!newParent.#isDirectory())
          throw "not-directory" satisfies ErrorCode;
        return {
          parent: newParent,
          name: x,
        };
      },
      { parent: this, name: first },
    );
  }

  readViaStream(offset: Filesize): InputStream {
    if (this.#isDirectory()) throw "is-directory" satisfies ErrorCode;
    if (this.delegate.readViaStream) return this.delegate.readViaStream(offset);
    throw "invalid" satisfies ErrorCode;
  }

  writeViaStream(offset: Filesize): OutputStream {
    if (this.#isDirectory()) throw "is-directory" satisfies ErrorCode;
    if (this.delegate.writeViaStream)
      return this.delegate.writeViaStream(offset, () => this.#updateMtime());
    throw "read-only" satisfies ErrorCode;
  }

  appendViaStream(): OutputStream {
    if (this.#isDirectory()) throw "is-directory" satisfies ErrorCode;
    if (this.delegate.appendViaStream)
      return this.delegate.appendViaStream(() => this.#updateMtime());
    if (!this.delegate.size) throw "invalid" satisfies ErrorCode;
    if (this.delegate.writeViaStream)
      return this.delegate.writeViaStream(this.delegate.size(), () =>
        this.#updateMtime(),
      );
    throw "read-only" satisfies ErrorCode;
  }

  advise(offset: Filesize, length: Filesize, advice: Advice): void {
    this.delegate.advise?.(offset, length, advice);
  }

  syncData(): void {
    this.delegate.syncData?.();
  }

  getType(): DescriptorType {
    return this.delegate.getType();
  }

  setSize(size: Filesize): void {
    if (this.#isDirectory()) throw "is-directory" satisfies ErrorCode;
    if (this.delegate.setSize) {
      this.delegate.setSize(size);
      this.#updateMtime();
    }
    throw "read-only" satisfies ErrorCode;
  }

  setTimes(
    dataAccessTimestamp: NewTimestamp,
    dataModificationTimestamp: NewTimestamp,
  ): void {
    if (!this.delegate.setSize && !this.delegate.link)
      throw "read-only" satisfies ErrorCode;
    const now = Node.now();
    if (
      now === undefined &&
      (dataAccessTimestamp.tag === "now" ||
        dataModificationTimestamp.tag === "now")
    )
      throw "unsupported" satisfies ErrorCode;

    const nextDataAccessTimestamp = (() => {
      switch (dataAccessTimestamp.tag) {
        case "no-change":
          return undefined;
        case "timestamp":
          return dataAccessTimestamp.val;
        case "now":
          return now;
        default:
          throw "unsupported" satisfies ErrorCode;
      }
    })();
    const nextDataModificationTimestamp = (() => {
      switch (dataModificationTimestamp.tag) {
        case "no-change":
          return undefined;
        case "timestamp":
          return dataModificationTimestamp.val;
        case "now":
          return now;
        default:
          throw "unsupported" satisfies ErrorCode;
      }
    })();

    if (nextDataAccessTimestamp !== undefined)
      this.dataAccessTimestamp = nextDataAccessTimestamp;
    if (nextDataModificationTimestamp !== undefined)
      this.dataModificationTimestamp = nextDataModificationTimestamp;
    if (
      now !== undefined &&
      (nextDataAccessTimestamp !== undefined ||
        nextDataModificationTimestamp !== undefined)
    )
      this.statusChangeTimestamp = now;
  }

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
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    return new DirectoryEntryStream(this.delegate[Symbol.iterator]());
  }

  sync(): void {
    this.delegate.sync?.();
  }

  #createDirectory(name: string): void {
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    if (!this.#isWritableDirectory()) throw "read-only" satisfies ErrorCode;
    const newDelegate = this.delegate.createDirectory();
    const newNode = this.#newNode(newDelegate);
    this.#link(newNode, name);
  }

  createDirectoryAt(path: string): void {
    const { parent, name } = this.#resolve({}, path);
    if (name === undefined) throw "invalid" satisfies ErrorCode;
    parent.#createDirectory(name);
  }

  stat(): DescriptorStat {
    return {
      type: this.getType(),
      linkCount: this.linkCount,
      size: this.delegate.size?.() ?? 0n,
      dataAccessTimestamp: this.dataAccessTimestamp ?? undefined,
      dataModificationTimestamp: this.dataModificationTimestamp ?? undefined,
      statusChangeTimestamp: this.statusChangeTimestamp ?? undefined,
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

  linkAt(
    oldPathFlags: PathFlags,
    oldPath: string,
    newNode: Node,
    newPath: string,
  ): void {
    const node = this.openAt(oldPathFlags, oldPath, {});
    newNode.#link(node, newPath);
  }

  #link(node: Node, path: string): void {
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    if (!this.#isWritableDirectory()) throw "read-only" satisfies ErrorCode;
    this.delegate.link(node, path);
    node.#linkCountIncrement();
    this.#updateMtime();
  }

  #unlink(name: string, predicate = (_node: Node) => {}): Node {
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    if (!this.#isWritableDirectory()) throw "read-only" satisfies ErrorCode;
    const node = this.delegate.unlink(name);
    try {
      predicate(node);
    } catch (e) {
      this.delegate.link(node, name);
      throw e;
    }
    node.#linkCountDecrement();
    this.#updateMtime();
    return node;
  }

  openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags): Node {
    const { parent, name } = this.#resolve(pathFlags, path);
    return parent.#open(name ?? ".", openFlags);
  }

  #open(name: string, openFlags: OpenFlags): Node {
    let newNode =
      name === "."
        ? this
        : (() => {
            try {
              return this.delegate.open?.(name);
            } catch (e) {
              if (e === "no-entry") return undefined;
              throw e;
            }
          })();

    if (openFlags.exclusive && newNode !== undefined)
      throw "exist" satisfies ErrorCode;
    if (newNode === undefined) {
      if (!openFlags.create) throw "no-entry" satisfies ErrorCode;
      if (openFlags.directory) throw "invalid" satisfies ErrorCode;
      if (!this.#isWritableDirectory()) throw "read-only" satisfies ErrorCode;
      const newDelegate = this.delegate.createFile();
      newNode = this.#newNode(newDelegate);
      this.#link(newNode, name);
    }
    if (openFlags.directory && !newNode.#isDirectory())
      throw "not-directory" satisfies ErrorCode;
    if (openFlags.truncate) newNode.setSize(0n);

    return newNode;
  }

  readlinkAt(path: string): string {
    const link = this.openAt(
      {
        symlinkFollow: false,
      },
      path,
      {},
    );
    if (link.getType() !== "symbolic-link") throw "invalid" as ErrorCode;
    return new TextDecoder().decode(
      InputStream.blockingReadToEnd(link.readViaStream(0n), link.stat().size),
    );
  }

  removeDirectoryAt(path: string): void {
    const { parent, name } = this.#resolve({}, path);
    if (name === undefined) throw "invalid" satisfies ErrorCode;
    parent.#removeDirectory(name);
  }

  #removeDirectory(name: string): void {
    this.#unlink(name, (node) => {
      if (!node.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    });
  }

  renameAt(
    oldPath: string,
    newNode: Node<DirectoryDelegate>,
    newPath: string,
  ): void {
    const { parent: oldParent, name: oldName } = this.#resolve({}, oldPath);
    const { parent: newParent, name: newName } = newNode.#resolve({}, newPath);
    if (oldName === undefined || newName === undefined)
      throw "invalid" satisfies ErrorCode;
    oldParent.#rename(oldName, newParent, newName);
  }

  #rename(
    oldName: string,
    newNode: Node<DirectoryDelegate>,
    newName: string,
  ): void {
    if (!this.#isDirectory() || !newNode.#isDirectory())
      throw "not-directory" satisfies ErrorCode;
    if (!this.#isWritableDirectory() || !newNode.#isWritableDirectory())
      throw "not-directory" satisfies ErrorCode;
    const node = this.delegate.unlink(oldName);
    try {
      newNode.delegate.link(node, newName);
    } catch (e) {
      this.delegate.link(node, oldName);
      throw e;
    }
  }

  symlinkAt(oldPath: string, newPath: string): void {
    const { parent, name } = this.#resolve({}, newPath);
    if (name === undefined) throw "invalid" satisfies ErrorCode;
    parent.#symlink(oldPath, name);
  }

  #symlink(oldPath: string, name: string): void {
    if (!this.#isDirectory()) throw "not-directory" satisfies ErrorCode;
    if (!this.#isWritableDirectory()) throw "read-only" satisfies ErrorCode;
    this.#link(this.#newNode(this.delegate.createSymlink(oldPath)), name);
  }

  unlinkFileAt(path: string): void {
    const { parent, name } = this.#resolve({}, path);
    if (name === undefined) throw "invalid" satisfies ErrorCode;
    parent.#unlinkFile(name);
  }

  #unlinkFile(name: string): void {
    this.#unlink(name, (node) => {
      if (node.#isDirectory()) throw "is-directory" satisfies ErrorCode;
    });
  }

  isSameObject(other: Node): boolean {
    return this === other;
  }

  metadataHash(): MetadataHashValue {
    return (
      this.delegate.metadataHash?.() ?? {
        upper: 0n,
        lower: 0n,
      }
    );
  }

  metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue {
    return this.openAt(pathFlags, path, {}).metadataHash();
  }
}
