import type { ErrorCode } from "../../../../../output/interfaces/wasi-filesystem-types";
import type WasiFilesystemTypes from "../../../../../output/interfaces/wasi-filesystem-types";
import type {
  DirectoryDelegate,
  SymlinkDelegate,
  WritableDirectoryDelegate,
  WritableFileDelegate,
} from "./delegate";
import { ArrayBufferFileDelegate, ArrayBufferSymlinkDelegate } from "./file";
import type { Node } from "./node";

export class MapDirectoryDelegate implements WritableDirectoryDelegate {
  #map = new Map<string, Node>();

  getType(): "directory" {
    return "directory";
  }

  createFile(): WritableFileDelegate {
    return new ArrayBufferFileDelegate(
      new ArrayBuffer(0, { maxByteLength: 2 ** 32 }),
    );
  }

  createDirectory(): DirectoryDelegate {
    return new MapDirectoryDelegate();
  }

  createSymlink(name: string): SymlinkDelegate {
    return new ArrayBufferSymlinkDelegate(name);
  }

  link(node: Node, name: string): void {
    this.#map.set(name, node);
  }

  unlink(name: string): Node {
    const out = this.open(name);
    this.#map.delete(name);
    return out;
  }

  open(name: string): Node {
    const node = this.#map.get(name);
    if (node === undefined) throw "no-entry" satisfies ErrorCode;
    return node;
  }

  *[Symbol.iterator](): Iterator<
    WasiFilesystemTypes.DirectoryEntry & {node: Node},
    undefined,
    undefined
  > {
    for (const [name, node] of this.#map.entries()) {
      yield {
        type: node.getType(),
        name,
        node,
      };
    }
  }
}
