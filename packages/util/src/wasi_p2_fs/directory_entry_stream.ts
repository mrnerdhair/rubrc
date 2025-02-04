import type {
  DirectoryEntry,
  WasiFilesystemTypes,
} from "../../../../output/interfaces/wasi-filesystem-types";

export class DirectoryEntryStream
  implements
    WasiFilesystemTypes.DirectoryEntryStream,
    IterableIterator<DirectoryEntry, undefined, undefined>
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

  [Symbol.iterator](): this {
    return this;
  }

  next(): IteratorResult<DirectoryEntry, undefined> {
    return this.#iter.next();
  }
}
