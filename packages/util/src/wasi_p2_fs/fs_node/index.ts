import {
  errno,
  type filesize,
  filetype,
  type linkcount,
  type timestamp,
} from "../../wasi_p1_defs";

export { FsFile } from "./file";
export { FsDir } from "./dir";
export { FsSymlink } from "./symlink";

export interface FsNode {
  readonly filetype: filetype;
  linkcount: linkcount;
  filesize?: filesize;
  atim: timestamp;
  mtim: timestamp;
  ctim: timestamp;

  [FsNode.SYNC]?(): void;
  [FsNode.DATASYNC]?(): void;
}

export namespace FsNode {
  export interface Dir extends FsNode, Map<string, FsNode> {
    readonly filetype: typeof filetype.directory;
  }

  export interface File<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
    extends FsNode,
      Uint8Array<TArrayBuffer> {
    readonly filetype: typeof filetype.regular_file;
  }

  export interface Symlink extends FsNode {
    readonly filetype: typeof filetype.symbolic_link;
    toString(): string;
  }

  export const SYNC = Symbol("FsNode.SYNC");
  export const DATASYNC = Symbol("FsNode.DATASYNC");

  export function isDir(x: FsNode | undefined): x is Dir {
    return x?.filetype === filetype.directory;
  }
  export function isFile(x: FsNode | undefined): x is File {
    return x?.filetype === filetype.regular_file;
  }
  export function isSymlink(x: FsNode | undefined): x is Symlink {
    return x?.filetype === filetype.symbolic_link;
  }
  export function sync(x: FsNode): void {
    x[SYNC]?.();
  }
  export function datasync(x: FsNode): void {
    x[DATASYNC]?.();
  }
  export function filesize(x: FsNode): filesize {
    return x.filesize ?? (0 as filesize);
  }
  export function set_filesize(x: FsNode, value: filesize): void {
    if (!("filesize" in x)) throw errno.inval;
    x.filesize = value;
  }
}
