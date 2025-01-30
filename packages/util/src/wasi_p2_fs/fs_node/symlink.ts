import { type Lazy, lazy } from "../../decorators/lazy";
import { readonly } from "../../decorators/validate";
import {
  errno,
  type filesize,
  filetype,
  type linkcount,
  type timestamp,
} from "../../wasi_p1_defs";
import type { FsNode } from "./index";

export class FsSymlink extends String implements FsNode.Symlink {
  @lazy
  @readonly(errno.inval)
  accessor filesize: Lazy<filesize> = lazy(() => {
    return new TextEncoder().encode(this.toString()).byteLength as filesize;
  });

  get filetype(): typeof filetype.symbolic_link {
    return filetype.symbolic_link;
  }
  linkcount = 0n as linkcount;
  get atim(): timestamp {
    return 0n as timestamp;
  }
  set atim(_value: timestamp) {}
  get mtim(): timestamp {
    return 0n as timestamp;
  }
  set mtim(_value: timestamp) {}
  get ctim(): timestamp {
    return 0n as timestamp;
  }
  set ctim(_value: timestamp) {}
}
