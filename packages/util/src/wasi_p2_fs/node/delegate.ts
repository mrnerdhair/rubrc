import type WasiFilesystemTypes from "../../../../../output/interfaces/wasi-filesystem-types";
import type { InputStream, OutputStream } from "../io";
import type { Node } from "./node";

export type DirectoryDelegateBase = Pick<
  WasiFilesystemTypes.Descriptor,
  "getType"
> &
  Partial<Pick<WasiFilesystemTypes.Descriptor, "sync" | "metadataHash">> & {
    getType(): "directory";
    createFile?(): WritableFileDelegate;
    createDirectory?(): DirectoryDelegate;
    createSymlink?(name: string): SymlinkDelegate;
    link?(node: Node, name: string): void;
    unlink?(name: string): Node;
    open(name: string): Node;
    [Symbol.iterator](): Iterator<
      WasiFilesystemTypes.DirectoryEntry,
      undefined,
      undefined
    >;
  } & Partial<
    Record<
      | "readViaStream"
      | "writeViaStream"
      | "appendViaStream"
      | "advise"
      | "syncData"
      | "setSize"
      | "size",
      never
    >
  >;

export type ReadOnlyDirectoryDelegate = DirectoryDelegateBase &
  Partial<
    Record<
      | "createFile"
      | "createDirectory"
      | "createSymlink"
      | "link"
      | "unlink"
      | "sync",
      never
    >
  >;
export type WritableDirectoryDelegate = DirectoryDelegateBase &
  Required<
    Pick<
      DirectoryDelegateBase,
      "createFile" | "createDirectory" | "createSymlink" | "link" | "unlink"
    >
  >;
export type DirectoryDelegate =
  | ReadOnlyDirectoryDelegate
  | WritableDirectoryDelegate;

type FileDelegateBase = Pick<WasiFilesystemTypes.Descriptor, "getType"> &
  Partial<
    Pick<
      WasiFilesystemTypes.Descriptor,
      "advise" | "setSize" | "syncData" | "sync" | "metadataHash"
    >
  > & {
    getType(): Exclude<
      ReturnType<WasiFilesystemTypes.Descriptor["getType"]>,
      "directory"
    >;
    readViaStream(offset: WasiFilesystemTypes.Filesize): InputStream;
    writeViaStream?(
      offset: WasiFilesystemTypes.Filesize,
      flush: () => void,
    ): OutputStream;
    appendViaStream?(flush: () => void): OutputStream;
    size(): WasiFilesystemTypes.Filesize;
  } & Partial<
    Record<
      | "createFile"
      | "createDirectory"
      | "createSymlink"
      | "link"
      | "unlink"
      | "open"
      | typeof Symbol.iterator,
      never
    >
  >;

export type ReadOnlyFileDelegate = FileDelegateBase &
  Partial<
    Record<
      "setSize" | "syncData" | "sync" | "writeViaStream" | "appendViaStream",
      never
    >
  >;
export type WritableFileDelegate = FileDelegateBase &
  Required<Pick<FileDelegateBase, "setSize" | "writeViaStream">>;
export type FileDelegate = ReadOnlyFileDelegate | WritableFileDelegate;

export type SymlinkDelegate = ReadOnlyFileDelegate & {
  getType(): "symbolic-link";
};

export type NodeDelegate =
  | DirectoryDelegate
  | ReadOnlyFileDelegate
  | WritableFileDelegate;
