import {
  filetype,
  type linkcount,
  type timestamp,
  u64,
} from "../../wasi_p1_defs";
import type { FsNode } from "./index";

export class FsDir extends Map<string, FsNode> implements FsNode.Dir {
  get filetype(): typeof filetype.directory {
    return filetype.directory;
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

  set(name: string, node: FsNode): this {
    node.linkcount = u64(node.linkcount + 1n) as linkcount;
    return super.set(name, node);
  }

  delete(name: string): true {
    const node = super.get(name);
    if (node === undefined || !super.delete(name))
      throw new Error(`deleting nonexistent node ${name}`);
    node.linkcount = u64(node.linkcount - 1n) as linkcount;
    return true;
  }
}
