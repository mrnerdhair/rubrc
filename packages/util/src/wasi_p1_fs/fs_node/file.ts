import {
  // errno,
  type filesize,
  filetype,
  type linkcount,
  type timestamp,
} from "../../wasi_p1_defs";
import type { FsNode } from "./index";

export class FsFile<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Uint8Array<TArrayBuffer>
  implements FsNode.File
{
  constructor(length?: number);
  constructor(view: ArrayBufferView<TArrayBuffer>);
  constructor(buffer: TArrayBuffer, byteOffset?: number, length?: number);
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor(
    ...args:
      | [length?: number]
      | [view: ArrayBufferView<TArrayBuffer>]
      | [buffer: TArrayBuffer, byteOffset?: number, length?: number]
  ) {
    // @ts-expect-error
    super(...args);
  }

  get filetype(): typeof filetype.regular_file {
    return filetype.regular_file;
  }
  linkcount = 0n as linkcount;
  get filesize(): filesize {
    return this.byteLength as filesize;
  }

  set filesize(value: filesize) {
    if (this.filesize === value) return;

    // const speciesConstructor = (
    //   this.constructor as unknown as {
    //     [Symbol.species]: {
    //       new (
    //         buffer: TArrayBuffer,
    //         byteOffset: number,
    //         byteLength: number,
    //       ): this;
    //     };
    //   }
    // )[Symbol.species];

    // const newBufferLen = this.byteOffset + value;
    // if (this.buffer instanceof SharedArrayBuffer) {
    //   if (newBufferLen > this.buffer.byteLength) {
    //     if (this.buffer.growable && newBufferLen <= this.buffer.maxByteLength) {
    //       this.buffer.grow(value);
    //     } else {
    //       throw errno.nospc;
    //     }
    //   }
    //   this.node = new speciesConstructor(this.buffer, this.byteOffset, value);
    // } else {
    //   if (this.buffer.resizable) {
    //     if (newBufferLen > this.buffer.maxByteLength) {
    //       this.node = new speciesConstructor(
    //         node.buffer.transferToFixedLength(newBufferLen),
    //         node.byteOffset,
    //         value,
    //       );
    //     } else {
    //       this.buffer.resize(value);
    //       this.node = new speciesConstructor(
    //         node.buffer,
    //         node.byteOffset,
    //         value,
    //       );
    //     }
    //   } else {
    //     this.node = new speciesConstructor(
    //       node.buffer.transfer(newBufferLen),
    //       node.byteOffset,
    //       value,
    //     );
    //   }
    // }
  }

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

// class MutableUint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> extends Uint8Array<TArrayBuffer> {
//   set byteLength(value: number) {
//     if (this.byteLength === value) return;

//     const speciesConstructor = (
//       this.constructor as unknown as {
//         [Symbol.species]: {
//           new (
//             buffer: TArrayBuffer,
//             byteOffset: number,
//             byteLength: number,
//           ): this;
//         };
//       }
//     )[Symbol.species];

//     const newBufferLen = this.byteOffset + value;
//     if (this.buffer instanceof SharedArrayBuffer) {
//       if (newBufferLen > this.buffer.byteLength) {
//         if (this.buffer.growable && newBufferLen <= this.buffer.maxByteLength) {
//           this.buffer.grow(value);
//         } else {
//           throw errno.nospc;
//         }
//       }
//       this.node = new speciesConstructor(this.buffer, this.byteOffset, value);
//     } else {
//       if (this.buffer.resizable) {
//         if (newBufferLen > this.buffer.maxByteLength) {
//           this.node = new speciesConstructor(
//             node.buffer.transferToFixedLength(newBufferLen),
//             node.byteOffset,
//             value,
//           );
//         } else {
//           this.buffer.resize(value);
//           this.node = new speciesConstructor(
//             node.buffer,
//             node.byteOffset,
//             value,
//           );
//         }
//       } else {
//         this.node = new speciesConstructor(
//           node.buffer.transfer(newBufferLen),
//           node.byteOffset,
//           value,
//         );
//       }
//     }
//   }
// }
