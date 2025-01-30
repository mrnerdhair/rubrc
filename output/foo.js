import { now, resolution } from "wasi:clocks/wall-clock";
import { getDirectories } from "wasi:filesystem/preopens";
import {
  Descriptor,
  DirectoryEntryStream,
  filesystemErrorCode,
} from "wasi:filesystem/types";
import { Error as Error$1 } from "wasi:io/error";
import { Pollable, poll } from "wasi:io/poll";
import { InputStream, OutputStream } from "wasi:io/streams";

const base64Compile = (str) =>
  WebAssembly.compile(
    typeof Buffer !== "undefined"
      ? Buffer.from(str, "base64")
      : Uint8Array.from(atob(str), (b) => b.charCodeAt(0)),
  );

let curResourceBorrows = [];

let dv = new DataView(new ArrayBuffer());
const dataView = (mem) =>
  dv.buffer === mem.buffer ? dv : (dv = new DataView(mem.buffer));

function getErrorPayload(e) {
  if (e && hasOwnProperty.call(e, "payload")) return e.payload;
  if (e instanceof Error) throw e;
  return e;
}

const handleTables = [];

const hasOwnProperty = Object.prototype.hasOwnProperty;

const instantiateCore = WebAssembly.instantiate;

const T_FLAG = 1 << 30;

function rscTableCreateOwn(table, rep) {
  const free = table[0] & ~T_FLAG;
  if (free === 0) {
    table.push(0);
    table.push(rep | T_FLAG);
    return (table.length >> 1) - 1;
  }
  table[0] = table[free << 1];
  table[free << 1] = 0;
  table[(free << 1) + 1] = rep | T_FLAG;
  return free;
}

function rscTableRemove(table, handle) {
  const scope = table[handle << 1];
  const val = table[(handle << 1) + 1];
  const own = (val & T_FLAG) !== 0;
  const rep = val & ~T_FLAG;
  if (val === 0 || (scope & T_FLAG) !== 0)
    throw new TypeError("Invalid handle");
  table[handle << 1] = table[0] | T_FLAG;
  table[0] = handle | T_FLAG;
  return { rep, scope, own };
}

const symbolCabiDispose = Symbol.for("cabiDispose");

const symbolRscHandle = Symbol("handle");

const symbolRscRep = Symbol.for("cabiRep");

const symbolDispose = Symbol.dispose || Symbol.for("dispose");

const toUint64 = (val) => BigInt.asUintN(64, BigInt(val));

function toUint32(val) {
  return val >>> 0;
}

const utf8Decoder = new TextDecoder();

const utf8Encoder = new TextEncoder();

let utf8EncodedLen = 0;
function utf8Encode(s, realloc, memory) {
  if (typeof s !== "string") throw new TypeError("expected a string");
  if (s.length === 0) {
    utf8EncodedLen = 0;
    return 1;
  }
  const buf = utf8Encoder.encode(s);
  const ptr = realloc(0, 0, 1, buf.length);
  new Uint8Array(memory.buffer).set(buf, ptr);
  utf8EncodedLen = buf.length;
  return ptr;
}

let exports0;
const handleTable1 = [T_FLAG, 0];
const captureTable1 = new Map();
let captureCnt1 = 0;
handleTables[1] = handleTable1;

function trampoline1(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable1.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Pollable.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.ready();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  return ret ? 1 : 0;
}

function trampoline2(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable1.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Pollable.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  rsc0.block();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
}
const handleTable2 = [T_FLAG, 0];
const captureTable2 = new Map();
let captureCnt2 = 0;
handleTables[2] = handleTable2;

function trampoline4(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.subscribe();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  if (!(ret instanceof Pollable)) {
    throw new TypeError('Resource error: Not a valid "Pollable" resource.');
  }
  var handle3 = ret[symbolRscHandle];
  if (!handle3) {
    const rep = ret[symbolRscRep] || ++captureCnt1;
    captureTable1.set(rep, ret);
    handle3 = rscTableCreateOwn(handleTable1, rep);
  }
  return handle3;
}
const handleTable3 = [T_FLAG, 0];
const captureTable3 = new Map();
let captureCnt3 = 0;
handleTables[3] = handleTable3;

function trampoline5(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.subscribe();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  if (!(ret instanceof Pollable)) {
    throw new TypeError('Resource error: Not a valid "Pollable" resource.');
  }
  var handle3 = ret[symbolRscHandle];
  if (!handle3) {
    const rep = ret[symbolRscRep] || ++captureCnt1;
    captureTable1.set(rep, ret);
    handle3 = rscTableCreateOwn(handleTable1, rep);
  }
  return handle3;
}
const handleTable4 = [T_FLAG, 0];
const captureTable4 = new Map();
let captureCnt4 = 0;
handleTables[4] = handleTable4;

function trampoline8(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable4[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable4.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, {
      writable: true,
      value: handle4,
    });
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5 });
  }
  curResourceBorrows.push(rsc3);
  const ret = rsc0.isSameObject(rsc3);
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  return ret ? 1 : 0;
}
let exports1;
let memory0;
let realloc0;
const handleTable0 = [T_FLAG, 0];
const captureTable0 = new Map();
let captureCnt0 = 0;
handleTables[0] = handleTable0;

function trampoline11(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable0[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable0.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Error$1.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.toDebugString();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var ptr3 = utf8Encode(ret, realloc0, memory0);
  var len3 = utf8EncodedLen;
  dataView(memory0).setInt32(arg1 + 4, len3, true);
  dataView(memory0).setInt32(arg1 + 0, ptr3, true);
}

function trampoline12(arg0, arg1, arg2) {
  var len3 = arg1;
  var base3 = arg0;
  var result3 = [];
  for (let i = 0; i < len3; i++) {
    const base = base3 + i * 4;
    var handle1 = dataView(memory0).getInt32(base + 0, true);
    var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
    var rsc0 = captureTable1.get(rep2);
    if (!rsc0) {
      rsc0 = Object.create(Pollable.prototype);
      Object.defineProperty(rsc0, symbolRscHandle, {
        writable: true,
        value: handle1,
      });
      Object.defineProperty(rsc0, symbolRscRep, {
        writable: true,
        value: rep2,
      });
    }
    curResourceBorrows.push(rsc0);
    result3.push(rsc0);
  }
  const ret = poll(result3);
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var val4 = ret;
  var len4 = val4.length;
  var ptr4 = realloc0(0, 0, 4, len4 * 4);
  var src4 = new Uint8Array(val4.buffer, val4.byteOffset, len4 * 4);
  new Uint8Array(memory0.buffer, ptr4, len4 * 4).set(src4);
  dataView(memory0).setInt32(arg2 + 4, len4, true);
  dataView(memory0).setInt32(arg2 + 0, ptr4, true);
}

function trampoline13(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.read(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      var val3 = e;
      var len3 = val3.byteLength;
      var ptr3 = realloc0(0, 0, 1, len3 * 1);
      var src3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, len3 * 1);
      new Uint8Array(memory0.buffer, ptr3, len3 * 1).set(src3);
      dataView(memory0).setInt32(arg2 + 8, len3, true);
      dataView(memory0).setInt32(arg2 + 4, ptr3, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case "last-operation-failed": {
          const e = variant5.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle4 = e[symbolRscHandle];
          if (!handle4) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle4 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 8, handle4, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline14(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.blockingRead(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      var val3 = e;
      var len3 = val3.byteLength;
      var ptr3 = realloc0(0, 0, 1, len3 * 1);
      var src3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, len3 * 1);
      new Uint8Array(memory0.buffer, ptr3, len3 * 1).set(src3);
      dataView(memory0).setInt32(arg2 + 8, len3, true);
      dataView(memory0).setInt32(arg2 + 4, ptr3, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case "last-operation-failed": {
          const e = variant5.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle4 = e[symbolRscHandle];
          if (!handle4) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle4 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 8, handle4, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline15(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.skip(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      dataView(memory0).setBigInt64(arg2 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 12, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline16(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.blockingSkip(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      dataView(memory0).setBigInt64(arg2 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 12, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline17(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.checkWrite() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg1 + 12, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg1 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline18(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.write(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case "last-operation-failed": {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle4 = e[symbolRscHandle];
          if (!handle4) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle4 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg3 + 8, handle4, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg3 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline19(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.blockingWriteAndFlush(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case "last-operation-failed": {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle4 = e[symbolRscHandle];
          if (!handle4) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle4 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg3 + 8, handle4, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg3 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline20(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.flush() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg1 + 8, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline21(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.blockingFlush() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg1 + 8, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline22(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.writeZeroes(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 8, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline23(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = {
      tag: "ok",
      val: rsc0.blockingWriteZeroesAndFlush(BigInt.asUintN(64, arg1)),
    };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case "last-operation-failed": {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg2 + 8, handle3, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline24(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable2[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable2.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, {
      writable: true,
      value: handle4,
    });
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5 });
  }
  curResourceBorrows.push(rsc3);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.splice(rsc3, BigInt.asUintN(64, arg2)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case "ok": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      dataView(memory0).setBigInt64(arg3 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant7 = e;
      switch (variant7.tag) {
        case "last-operation-failed": {
          const e = variant7.val;
          dataView(memory0).setInt8(arg3 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle6 = e[symbolRscHandle];
          if (!handle6) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle6 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg3 + 12, handle6, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg3 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline25(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable2[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable2.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, {
      writable: true,
      value: handle4,
    });
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5 });
  }
  curResourceBorrows.push(rsc3);
  let ret;
  try {
    ret = {
      tag: "ok",
      val: rsc0.blockingSplice(rsc3, BigInt.asUintN(64, arg2)),
    };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case "ok": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      dataView(memory0).setBigInt64(arg3 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant7 = e;
      switch (variant7.tag) {
        case "last-operation-failed": {
          const e = variant7.val;
          dataView(memory0).setInt8(arg3 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError(
              'Resource error: Not a valid "Error" resource.',
            );
          }
          var handle6 = e[symbolRscHandle];
          if (!handle6) {
            const rep = e[symbolRscRep] || ++captureCnt0;
            captureTable0.set(rep, e);
            handle6 = rscTableCreateOwn(handleTable0, rep);
          }
          dataView(memory0).setInt32(arg3 + 12, handle6, true);
          break;
        }
        case "closed": {
          dataView(memory0).setInt8(arg3 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(
            `invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`StreamError\``,
          );
        }
      }
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline26(arg0) {
  const ret = now();
  var { seconds: v0_0, nanoseconds: v0_1 } = ret;
  dataView(memory0).setBigInt64(arg0 + 0, toUint64(v0_0), true);
  dataView(memory0).setInt32(arg0 + 8, toUint32(v0_1), true);
}

function trampoline27(arg0) {
  const ret = resolution();
  var { seconds: v0_0, nanoseconds: v0_1 } = ret;
  dataView(memory0).setBigInt64(arg0 + 0, toUint64(v0_0), true);
  dataView(memory0).setInt32(arg0 + 8, toUint32(v0_1), true);
}

function trampoline28(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.readViaStream(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      if (!(e instanceof InputStream)) {
        throw new TypeError(
          'Resource error: Not a valid "InputStream" resource.',
        );
      }
      var handle3 = e[symbolRscHandle];
      if (!handle3) {
        const rep = e[symbolRscRep] || ++captureCnt2;
        captureTable2.set(rep, e);
        handle3 = rscTableCreateOwn(handleTable2, rep);
      }
      dataView(memory0).setInt32(arg2 + 4, handle3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg2 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline29(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.writeViaStream(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      if (!(e instanceof OutputStream)) {
        throw new TypeError(
          'Resource error: Not a valid "OutputStream" resource.',
        );
      }
      var handle3 = e[symbolRscHandle];
      if (!handle3) {
        const rep = e[symbolRscRep] || ++captureCnt3;
        captureTable3.set(rep, e);
        handle3 = rscTableCreateOwn(handleTable3, rep);
      }
      dataView(memory0).setInt32(arg2 + 4, handle3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg2 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline30(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.appendViaStream() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof OutputStream)) {
        throw new TypeError(
          'Resource error: Not a valid "OutputStream" resource.',
        );
      }
      var handle3 = e[symbolRscHandle];
      if (!handle3) {
        const rep = e[symbolRscRep] || ++captureCnt3;
        captureTable3.set(rep, e);
        handle3 = rscTableCreateOwn(handleTable3, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline31(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let enum3;
  switch (arg3) {
    case 0: {
      enum3 = "normal";
      break;
    }
    case 1: {
      enum3 = "sequential";
      break;
    }
    case 2: {
      enum3 = "random";
      break;
    }
    case 3: {
      enum3 = "will-need";
      break;
    }
    case 4: {
      enum3 = "dont-need";
      break;
    }
    case 5: {
      enum3 = "no-reuse";
      break;
    }
    default: {
      throw new TypeError("invalid discriminant specified for Advice");
    }
  }
  let ret;
  try {
    ret = {
      tag: "ok",
      val: rsc0.advise(
        BigInt.asUintN(64, arg1),
        BigInt.asUintN(64, arg2),
        enum3,
      ),
    };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg4 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline32(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.syncData() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case "ok": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case "access": {
          enum3 = 0;
          break;
        }
        case "would-block": {
          enum3 = 1;
          break;
        }
        case "already": {
          enum3 = 2;
          break;
        }
        case "bad-descriptor": {
          enum3 = 3;
          break;
        }
        case "busy": {
          enum3 = 4;
          break;
        }
        case "deadlock": {
          enum3 = 5;
          break;
        }
        case "quota": {
          enum3 = 6;
          break;
        }
        case "exist": {
          enum3 = 7;
          break;
        }
        case "file-too-large": {
          enum3 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum3 = 9;
          break;
        }
        case "in-progress": {
          enum3 = 10;
          break;
        }
        case "interrupted": {
          enum3 = 11;
          break;
        }
        case "invalid": {
          enum3 = 12;
          break;
        }
        case "io": {
          enum3 = 13;
          break;
        }
        case "is-directory": {
          enum3 = 14;
          break;
        }
        case "loop": {
          enum3 = 15;
          break;
        }
        case "too-many-links": {
          enum3 = 16;
          break;
        }
        case "message-size": {
          enum3 = 17;
          break;
        }
        case "name-too-long": {
          enum3 = 18;
          break;
        }
        case "no-device": {
          enum3 = 19;
          break;
        }
        case "no-entry": {
          enum3 = 20;
          break;
        }
        case "no-lock": {
          enum3 = 21;
          break;
        }
        case "insufficient-memory": {
          enum3 = 22;
          break;
        }
        case "insufficient-space": {
          enum3 = 23;
          break;
        }
        case "not-directory": {
          enum3 = 24;
          break;
        }
        case "not-empty": {
          enum3 = 25;
          break;
        }
        case "not-recoverable": {
          enum3 = 26;
          break;
        }
        case "unsupported": {
          enum3 = 27;
          break;
        }
        case "no-tty": {
          enum3 = 28;
          break;
        }
        case "no-such-device": {
          enum3 = 29;
          break;
        }
        case "overflow": {
          enum3 = 30;
          break;
        }
        case "not-permitted": {
          enum3 = 31;
          break;
        }
        case "pipe": {
          enum3 = 32;
          break;
        }
        case "read-only": {
          enum3 = 33;
          break;
        }
        case "invalid-seek": {
          enum3 = 34;
          break;
        }
        case "text-file-busy": {
          enum3 = 35;
          break;
        }
        case "cross-device": {
          enum3 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val3}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline33(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.getFlags() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      let flags3 = 0;
      if (typeof e === "object" && e !== null) {
        flags3 =
          (Boolean(e.read) << 0) |
          (Boolean(e.write) << 1) |
          (Boolean(e.fileIntegritySync) << 2) |
          (Boolean(e.dataIntegritySync) << 3) |
          (Boolean(e.requestedWriteSync) << 4) |
          (Boolean(e.mutateDirectory) << 5);
      } else if (e !== null && e !== undefined) {
        throw new TypeError(
          "only an object, undefined or null can be converted to flags",
        );
      }
      dataView(memory0).setInt8(arg1 + 1, flags3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline34(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.getType() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case "unknown": {
          enum3 = 0;
          break;
        }
        case "block-device": {
          enum3 = 1;
          break;
        }
        case "character-device": {
          enum3 = 2;
          break;
        }
        case "directory": {
          enum3 = 3;
          break;
        }
        case "fifo": {
          enum3 = 4;
          break;
        }
        case "symbolic-link": {
          enum3 = 5;
          break;
        }
        case "regular-file": {
          enum3 = 6;
          break;
        }
        case "socket": {
          enum3 = 7;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val3}" is not one of the cases of descriptor-type`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline35(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.setSize(BigInt.asUintN(64, arg1)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case "ok": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case "access": {
          enum3 = 0;
          break;
        }
        case "would-block": {
          enum3 = 1;
          break;
        }
        case "already": {
          enum3 = 2;
          break;
        }
        case "bad-descriptor": {
          enum3 = 3;
          break;
        }
        case "busy": {
          enum3 = 4;
          break;
        }
        case "deadlock": {
          enum3 = 5;
          break;
        }
        case "quota": {
          enum3 = 6;
          break;
        }
        case "exist": {
          enum3 = 7;
          break;
        }
        case "file-too-large": {
          enum3 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum3 = 9;
          break;
        }
        case "in-progress": {
          enum3 = 10;
          break;
        }
        case "interrupted": {
          enum3 = 11;
          break;
        }
        case "invalid": {
          enum3 = 12;
          break;
        }
        case "io": {
          enum3 = 13;
          break;
        }
        case "is-directory": {
          enum3 = 14;
          break;
        }
        case "loop": {
          enum3 = 15;
          break;
        }
        case "too-many-links": {
          enum3 = 16;
          break;
        }
        case "message-size": {
          enum3 = 17;
          break;
        }
        case "name-too-long": {
          enum3 = 18;
          break;
        }
        case "no-device": {
          enum3 = 19;
          break;
        }
        case "no-entry": {
          enum3 = 20;
          break;
        }
        case "no-lock": {
          enum3 = 21;
          break;
        }
        case "insufficient-memory": {
          enum3 = 22;
          break;
        }
        case "insufficient-space": {
          enum3 = 23;
          break;
        }
        case "not-directory": {
          enum3 = 24;
          break;
        }
        case "not-empty": {
          enum3 = 25;
          break;
        }
        case "not-recoverable": {
          enum3 = 26;
          break;
        }
        case "unsupported": {
          enum3 = 27;
          break;
        }
        case "no-tty": {
          enum3 = 28;
          break;
        }
        case "no-such-device": {
          enum3 = 29;
          break;
        }
        case "overflow": {
          enum3 = 30;
          break;
        }
        case "not-permitted": {
          enum3 = 31;
          break;
        }
        case "pipe": {
          enum3 = 32;
          break;
        }
        case "read-only": {
          enum3 = 33;
          break;
        }
        case "invalid-seek": {
          enum3 = 34;
          break;
        }
        case "text-file-busy": {
          enum3 = 35;
          break;
        }
        case "cross-device": {
          enum3 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val3}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline36(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let variant3;
  switch (arg1) {
    case 0: {
      variant3 = {
        tag: "no-change",
      };
      break;
    }
    case 1: {
      variant3 = {
        tag: "now",
      };
      break;
    }
    case 2: {
      variant3 = {
        tag: "timestamp",
        val: {
          seconds: BigInt.asUintN(64, arg2),
          nanoseconds: arg3 >>> 0,
        },
      };
      break;
    }
    default: {
      throw new TypeError("invalid variant discriminant for NewTimestamp");
    }
  }
  let variant4;
  switch (arg4) {
    case 0: {
      variant4 = {
        tag: "no-change",
      };
      break;
    }
    case 1: {
      variant4 = {
        tag: "now",
      };
      break;
    }
    case 2: {
      variant4 = {
        tag: "timestamp",
        val: {
          seconds: BigInt.asUintN(64, arg5),
          nanoseconds: arg6 >>> 0,
        },
      };
      break;
    }
    default: {
      throw new TypeError("invalid variant discriminant for NewTimestamp");
    }
  }
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.setTimes(variant3, variant4) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg7 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg7 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case "access": {
          enum5 = 0;
          break;
        }
        case "would-block": {
          enum5 = 1;
          break;
        }
        case "already": {
          enum5 = 2;
          break;
        }
        case "bad-descriptor": {
          enum5 = 3;
          break;
        }
        case "busy": {
          enum5 = 4;
          break;
        }
        case "deadlock": {
          enum5 = 5;
          break;
        }
        case "quota": {
          enum5 = 6;
          break;
        }
        case "exist": {
          enum5 = 7;
          break;
        }
        case "file-too-large": {
          enum5 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum5 = 9;
          break;
        }
        case "in-progress": {
          enum5 = 10;
          break;
        }
        case "interrupted": {
          enum5 = 11;
          break;
        }
        case "invalid": {
          enum5 = 12;
          break;
        }
        case "io": {
          enum5 = 13;
          break;
        }
        case "is-directory": {
          enum5 = 14;
          break;
        }
        case "loop": {
          enum5 = 15;
          break;
        }
        case "too-many-links": {
          enum5 = 16;
          break;
        }
        case "message-size": {
          enum5 = 17;
          break;
        }
        case "name-too-long": {
          enum5 = 18;
          break;
        }
        case "no-device": {
          enum5 = 19;
          break;
        }
        case "no-entry": {
          enum5 = 20;
          break;
        }
        case "no-lock": {
          enum5 = 21;
          break;
        }
        case "insufficient-memory": {
          enum5 = 22;
          break;
        }
        case "insufficient-space": {
          enum5 = 23;
          break;
        }
        case "not-directory": {
          enum5 = 24;
          break;
        }
        case "not-empty": {
          enum5 = 25;
          break;
        }
        case "not-recoverable": {
          enum5 = 26;
          break;
        }
        case "unsupported": {
          enum5 = 27;
          break;
        }
        case "no-tty": {
          enum5 = 28;
          break;
        }
        case "no-such-device": {
          enum5 = 29;
          break;
        }
        case "overflow": {
          enum5 = 30;
          break;
        }
        case "not-permitted": {
          enum5 = 31;
          break;
        }
        case "pipe": {
          enum5 = 32;
          break;
        }
        case "read-only": {
          enum5 = 33;
          break;
        }
        case "invalid-seek": {
          enum5 = 34;
          break;
        }
        case "text-file-busy": {
          enum5 = 35;
          break;
        }
        case "cross-device": {
          enum5 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val5}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg7 + 1, enum5, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline37(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = {
      tag: "ok",
      val: rsc0.read(BigInt.asUintN(64, arg1), BigInt.asUintN(64, arg2)),
    };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      var [tuple3_0, tuple3_1] = e;
      var val4 = tuple3_0;
      var len4 = val4.byteLength;
      var ptr4 = realloc0(0, 0, 1, len4 * 1);
      var src4 = new Uint8Array(val4.buffer || val4, val4.byteOffset, len4 * 1);
      new Uint8Array(memory0.buffer, ptr4, len4 * 1).set(src4);
      dataView(memory0).setInt32(arg3 + 8, len4, true);
      dataView(memory0).setInt32(arg3 + 4, ptr4, true);
      dataView(memory0).setInt8(arg3 + 12, tuple3_1 ? 1 : 0, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case "access": {
          enum5 = 0;
          break;
        }
        case "would-block": {
          enum5 = 1;
          break;
        }
        case "already": {
          enum5 = 2;
          break;
        }
        case "bad-descriptor": {
          enum5 = 3;
          break;
        }
        case "busy": {
          enum5 = 4;
          break;
        }
        case "deadlock": {
          enum5 = 5;
          break;
        }
        case "quota": {
          enum5 = 6;
          break;
        }
        case "exist": {
          enum5 = 7;
          break;
        }
        case "file-too-large": {
          enum5 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum5 = 9;
          break;
        }
        case "in-progress": {
          enum5 = 10;
          break;
        }
        case "interrupted": {
          enum5 = 11;
          break;
        }
        case "invalid": {
          enum5 = 12;
          break;
        }
        case "io": {
          enum5 = 13;
          break;
        }
        case "is-directory": {
          enum5 = 14;
          break;
        }
        case "loop": {
          enum5 = 15;
          break;
        }
        case "too-many-links": {
          enum5 = 16;
          break;
        }
        case "message-size": {
          enum5 = 17;
          break;
        }
        case "name-too-long": {
          enum5 = 18;
          break;
        }
        case "no-device": {
          enum5 = 19;
          break;
        }
        case "no-entry": {
          enum5 = 20;
          break;
        }
        case "no-lock": {
          enum5 = 21;
          break;
        }
        case "insufficient-memory": {
          enum5 = 22;
          break;
        }
        case "insufficient-space": {
          enum5 = 23;
          break;
        }
        case "not-directory": {
          enum5 = 24;
          break;
        }
        case "not-empty": {
          enum5 = 25;
          break;
        }
        case "not-recoverable": {
          enum5 = 26;
          break;
        }
        case "unsupported": {
          enum5 = 27;
          break;
        }
        case "no-tty": {
          enum5 = 28;
          break;
        }
        case "no-such-device": {
          enum5 = 29;
          break;
        }
        case "overflow": {
          enum5 = 30;
          break;
        }
        case "not-permitted": {
          enum5 = 31;
          break;
        }
        case "pipe": {
          enum5 = 32;
          break;
        }
        case "read-only": {
          enum5 = 33;
          break;
        }
        case "invalid-seek": {
          enum5 = 34;
          break;
        }
        case "text-file-busy": {
          enum5 = 35;
          break;
        }
        case "cross-device": {
          enum5 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val5}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg3 + 4, enum5, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline38(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.write(result3, BigInt.asUintN(64, arg3)) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      dataView(memory0).setBigInt64(arg4 + 8, toUint64(e), true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}
const handleTable5 = [T_FLAG, 0];
const captureTable5 = new Map();
let captureCnt5 = 0;
handleTables[5] = handleTable5;

function trampoline39(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.readDirectory() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof DirectoryEntryStream)) {
        throw new TypeError(
          'Resource error: Not a valid "DirectoryEntryStream" resource.',
        );
      }
      var handle3 = e[symbolRscHandle];
      if (!handle3) {
        const rep = e[symbolRscRep] || ++captureCnt5;
        captureTable5.set(rep, e);
        handle3 = rscTableCreateOwn(handleTable5, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle3, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline40(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.sync() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case "ok": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case "access": {
          enum3 = 0;
          break;
        }
        case "would-block": {
          enum3 = 1;
          break;
        }
        case "already": {
          enum3 = 2;
          break;
        }
        case "bad-descriptor": {
          enum3 = 3;
          break;
        }
        case "busy": {
          enum3 = 4;
          break;
        }
        case "deadlock": {
          enum3 = 5;
          break;
        }
        case "quota": {
          enum3 = 6;
          break;
        }
        case "exist": {
          enum3 = 7;
          break;
        }
        case "file-too-large": {
          enum3 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum3 = 9;
          break;
        }
        case "in-progress": {
          enum3 = 10;
          break;
        }
        case "interrupted": {
          enum3 = 11;
          break;
        }
        case "invalid": {
          enum3 = 12;
          break;
        }
        case "io": {
          enum3 = 13;
          break;
        }
        case "is-directory": {
          enum3 = 14;
          break;
        }
        case "loop": {
          enum3 = 15;
          break;
        }
        case "too-many-links": {
          enum3 = 16;
          break;
        }
        case "message-size": {
          enum3 = 17;
          break;
        }
        case "name-too-long": {
          enum3 = 18;
          break;
        }
        case "no-device": {
          enum3 = 19;
          break;
        }
        case "no-entry": {
          enum3 = 20;
          break;
        }
        case "no-lock": {
          enum3 = 21;
          break;
        }
        case "insufficient-memory": {
          enum3 = 22;
          break;
        }
        case "insufficient-space": {
          enum3 = 23;
          break;
        }
        case "not-directory": {
          enum3 = 24;
          break;
        }
        case "not-empty": {
          enum3 = 25;
          break;
        }
        case "not-recoverable": {
          enum3 = 26;
          break;
        }
        case "unsupported": {
          enum3 = 27;
          break;
        }
        case "no-tty": {
          enum3 = 28;
          break;
        }
        case "no-such-device": {
          enum3 = 29;
          break;
        }
        case "overflow": {
          enum3 = 30;
          break;
        }
        case "not-permitted": {
          enum3 = 31;
          break;
        }
        case "pipe": {
          enum3 = 32;
          break;
        }
        case "read-only": {
          enum3 = 33;
          break;
        }
        case "invalid-seek": {
          enum3 = 34;
          break;
        }
        case "text-file-busy": {
          enum3 = 35;
          break;
        }
        case "cross-device": {
          enum3 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val3}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline41(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.createDirectoryAt(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline42(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.stat() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant12 = ret;
  switch (variant12.tag) {
    case "ok": {
      const e = variant12.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var {
        type: v3_0,
        linkCount: v3_1,
        size: v3_2,
        dataAccessTimestamp: v3_3,
        dataModificationTimestamp: v3_4,
        statusChangeTimestamp: v3_5,
      } = e;
      var val4 = v3_0;
      let enum4;
      switch (val4) {
        case "unknown": {
          enum4 = 0;
          break;
        }
        case "block-device": {
          enum4 = 1;
          break;
        }
        case "character-device": {
          enum4 = 2;
          break;
        }
        case "directory": {
          enum4 = 3;
          break;
        }
        case "fifo": {
          enum4 = 4;
          break;
        }
        case "symbolic-link": {
          enum4 = 5;
          break;
        }
        case "regular-file": {
          enum4 = 6;
          break;
        }
        case "socket": {
          enum4 = 7;
          break;
        }
        default: {
          if (v3_0 instanceof Error) {
            console.error(v3_0);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of descriptor-type`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum4, true);
      dataView(memory0).setBigInt64(arg1 + 16, toUint64(v3_1), true);
      dataView(memory0).setBigInt64(arg1 + 24, toUint64(v3_2), true);
      var variant6 = v3_3;
      if (variant6 === null || variant6 === undefined) {
        dataView(memory0).setInt8(arg1 + 32, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(arg1 + 32, 1, true);
        var { seconds: v5_0, nanoseconds: v5_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 40, toUint64(v5_0), true);
        dataView(memory0).setInt32(arg1 + 48, toUint32(v5_1), true);
      }
      var variant8 = v3_4;
      if (variant8 === null || variant8 === undefined) {
        dataView(memory0).setInt8(arg1 + 56, 0, true);
      } else {
        const e = variant8;
        dataView(memory0).setInt8(arg1 + 56, 1, true);
        var { seconds: v7_0, nanoseconds: v7_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 64, toUint64(v7_0), true);
        dataView(memory0).setInt32(arg1 + 72, toUint32(v7_1), true);
      }
      var variant10 = v3_5;
      if (variant10 === null || variant10 === undefined) {
        dataView(memory0).setInt8(arg1 + 80, 0, true);
      } else {
        const e = variant10;
        dataView(memory0).setInt8(arg1 + 80, 1, true);
        var { seconds: v9_0, nanoseconds: v9_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 88, toUint64(v9_0), true);
        dataView(memory0).setInt32(arg1 + 96, toUint32(v9_1), true);
      }
      break;
    }
    case "err": {
      const e = variant12.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val11 = e;
      let enum11;
      switch (val11) {
        case "access": {
          enum11 = 0;
          break;
        }
        case "would-block": {
          enum11 = 1;
          break;
        }
        case "already": {
          enum11 = 2;
          break;
        }
        case "bad-descriptor": {
          enum11 = 3;
          break;
        }
        case "busy": {
          enum11 = 4;
          break;
        }
        case "deadlock": {
          enum11 = 5;
          break;
        }
        case "quota": {
          enum11 = 6;
          break;
        }
        case "exist": {
          enum11 = 7;
          break;
        }
        case "file-too-large": {
          enum11 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum11 = 9;
          break;
        }
        case "in-progress": {
          enum11 = 10;
          break;
        }
        case "interrupted": {
          enum11 = 11;
          break;
        }
        case "invalid": {
          enum11 = 12;
          break;
        }
        case "io": {
          enum11 = 13;
          break;
        }
        case "is-directory": {
          enum11 = 14;
          break;
        }
        case "loop": {
          enum11 = 15;
          break;
        }
        case "too-many-links": {
          enum11 = 16;
          break;
        }
        case "message-size": {
          enum11 = 17;
          break;
        }
        case "name-too-long": {
          enum11 = 18;
          break;
        }
        case "no-device": {
          enum11 = 19;
          break;
        }
        case "no-entry": {
          enum11 = 20;
          break;
        }
        case "no-lock": {
          enum11 = 21;
          break;
        }
        case "insufficient-memory": {
          enum11 = 22;
          break;
        }
        case "insufficient-space": {
          enum11 = 23;
          break;
        }
        case "not-directory": {
          enum11 = 24;
          break;
        }
        case "not-empty": {
          enum11 = 25;
          break;
        }
        case "not-recoverable": {
          enum11 = 26;
          break;
        }
        case "unsupported": {
          enum11 = 27;
          break;
        }
        case "no-tty": {
          enum11 = 28;
          break;
        }
        case "no-such-device": {
          enum11 = 29;
          break;
        }
        case "overflow": {
          enum11 = 30;
          break;
        }
        case "not-permitted": {
          enum11 = 31;
          break;
        }
        case "pipe": {
          enum11 = 32;
          break;
        }
        case "read-only": {
          enum11 = 33;
          break;
        }
        case "invalid-seek": {
          enum11 = 34;
          break;
        }
        case "text-file-busy": {
          enum11 = 35;
          break;
        }
        case "cross-device": {
          enum11 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val11}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum11, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline43(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.statAt(flags3, result4) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant14 = ret;
  switch (variant14.tag) {
    case "ok": {
      const e = variant14.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      var {
        type: v5_0,
        linkCount: v5_1,
        size: v5_2,
        dataAccessTimestamp: v5_3,
        dataModificationTimestamp: v5_4,
        statusChangeTimestamp: v5_5,
      } = e;
      var val6 = v5_0;
      let enum6;
      switch (val6) {
        case "unknown": {
          enum6 = 0;
          break;
        }
        case "block-device": {
          enum6 = 1;
          break;
        }
        case "character-device": {
          enum6 = 2;
          break;
        }
        case "directory": {
          enum6 = 3;
          break;
        }
        case "fifo": {
          enum6 = 4;
          break;
        }
        case "symbolic-link": {
          enum6 = 5;
          break;
        }
        case "regular-file": {
          enum6 = 6;
          break;
        }
        case "socket": {
          enum6 = 7;
          break;
        }
        default: {
          if (v5_0 instanceof Error) {
            console.error(v5_0);
          }

          throw new TypeError(
            `"${val6}" is not one of the cases of descriptor-type`,
          );
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum6, true);
      dataView(memory0).setBigInt64(arg4 + 16, toUint64(v5_1), true);
      dataView(memory0).setBigInt64(arg4 + 24, toUint64(v5_2), true);
      var variant8 = v5_3;
      if (variant8 === null || variant8 === undefined) {
        dataView(memory0).setInt8(arg4 + 32, 0, true);
      } else {
        const e = variant8;
        dataView(memory0).setInt8(arg4 + 32, 1, true);
        var { seconds: v7_0, nanoseconds: v7_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 40, toUint64(v7_0), true);
        dataView(memory0).setInt32(arg4 + 48, toUint32(v7_1), true);
      }
      var variant10 = v5_4;
      if (variant10 === null || variant10 === undefined) {
        dataView(memory0).setInt8(arg4 + 56, 0, true);
      } else {
        const e = variant10;
        dataView(memory0).setInt8(arg4 + 56, 1, true);
        var { seconds: v9_0, nanoseconds: v9_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 64, toUint64(v9_0), true);
        dataView(memory0).setInt32(arg4 + 72, toUint32(v9_1), true);
      }
      var variant12 = v5_5;
      if (variant12 === null || variant12 === undefined) {
        dataView(memory0).setInt8(arg4 + 80, 0, true);
      } else {
        const e = variant12;
        dataView(memory0).setInt8(arg4 + 80, 1, true);
        var { seconds: v11_0, nanoseconds: v11_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 88, toUint64(v11_0), true);
        dataView(memory0).setInt32(arg4 + 96, toUint32(v11_1), true);
      }
      break;
    }
    case "err": {
      const e = variant14.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val13 = e;
      let enum13;
      switch (val13) {
        case "access": {
          enum13 = 0;
          break;
        }
        case "would-block": {
          enum13 = 1;
          break;
        }
        case "already": {
          enum13 = 2;
          break;
        }
        case "bad-descriptor": {
          enum13 = 3;
          break;
        }
        case "busy": {
          enum13 = 4;
          break;
        }
        case "deadlock": {
          enum13 = 5;
          break;
        }
        case "quota": {
          enum13 = 6;
          break;
        }
        case "exist": {
          enum13 = 7;
          break;
        }
        case "file-too-large": {
          enum13 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum13 = 9;
          break;
        }
        case "in-progress": {
          enum13 = 10;
          break;
        }
        case "interrupted": {
          enum13 = 11;
          break;
        }
        case "invalid": {
          enum13 = 12;
          break;
        }
        case "io": {
          enum13 = 13;
          break;
        }
        case "is-directory": {
          enum13 = 14;
          break;
        }
        case "loop": {
          enum13 = 15;
          break;
        }
        case "too-many-links": {
          enum13 = 16;
          break;
        }
        case "message-size": {
          enum13 = 17;
          break;
        }
        case "name-too-long": {
          enum13 = 18;
          break;
        }
        case "no-device": {
          enum13 = 19;
          break;
        }
        case "no-entry": {
          enum13 = 20;
          break;
        }
        case "no-lock": {
          enum13 = 21;
          break;
        }
        case "insufficient-memory": {
          enum13 = 22;
          break;
        }
        case "insufficient-space": {
          enum13 = 23;
          break;
        }
        case "not-directory": {
          enum13 = 24;
          break;
        }
        case "not-empty": {
          enum13 = 25;
          break;
        }
        case "not-recoverable": {
          enum13 = 26;
          break;
        }
        case "unsupported": {
          enum13 = 27;
          break;
        }
        case "no-tty": {
          enum13 = 28;
          break;
        }
        case "no-such-device": {
          enum13 = 29;
          break;
        }
        case "overflow": {
          enum13 = 30;
          break;
        }
        case "not-permitted": {
          enum13 = 31;
          break;
        }
        case "pipe": {
          enum13 = 32;
          break;
        }
        case "read-only": {
          enum13 = 33;
          break;
        }
        case "invalid-seek": {
          enum13 = 34;
          break;
        }
        case "text-file-busy": {
          enum13 = 35;
          break;
        }
        case "cross-device": {
          enum13 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val13}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum13, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline44(
  arg0,
  arg1,
  arg2,
  arg3,
  arg4,
  arg5,
  arg6,
  arg7,
  arg8,
  arg9,
  arg10,
) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let variant5;
  switch (arg4) {
    case 0: {
      variant5 = {
        tag: "no-change",
      };
      break;
    }
    case 1: {
      variant5 = {
        tag: "now",
      };
      break;
    }
    case 2: {
      variant5 = {
        tag: "timestamp",
        val: {
          seconds: BigInt.asUintN(64, arg5),
          nanoseconds: arg6 >>> 0,
        },
      };
      break;
    }
    default: {
      throw new TypeError("invalid variant discriminant for NewTimestamp");
    }
  }
  let variant6;
  switch (arg7) {
    case 0: {
      variant6 = {
        tag: "no-change",
      };
      break;
    }
    case 1: {
      variant6 = {
        tag: "now",
      };
      break;
    }
    case 2: {
      variant6 = {
        tag: "timestamp",
        val: {
          seconds: BigInt.asUintN(64, arg8),
          nanoseconds: arg9 >>> 0,
        },
      };
      break;
    }
    default: {
      throw new TypeError("invalid variant discriminant for NewTimestamp");
    }
  }
  let ret;
  try {
    ret = {
      tag: "ok",
      val: rsc0.setTimesAt(flags3, result4, variant5, variant6),
    };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case "ok": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg10 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg10 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case "access": {
          enum7 = 0;
          break;
        }
        case "would-block": {
          enum7 = 1;
          break;
        }
        case "already": {
          enum7 = 2;
          break;
        }
        case "bad-descriptor": {
          enum7 = 3;
          break;
        }
        case "busy": {
          enum7 = 4;
          break;
        }
        case "deadlock": {
          enum7 = 5;
          break;
        }
        case "quota": {
          enum7 = 6;
          break;
        }
        case "exist": {
          enum7 = 7;
          break;
        }
        case "file-too-large": {
          enum7 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum7 = 9;
          break;
        }
        case "in-progress": {
          enum7 = 10;
          break;
        }
        case "interrupted": {
          enum7 = 11;
          break;
        }
        case "invalid": {
          enum7 = 12;
          break;
        }
        case "io": {
          enum7 = 13;
          break;
        }
        case "is-directory": {
          enum7 = 14;
          break;
        }
        case "loop": {
          enum7 = 15;
          break;
        }
        case "too-many-links": {
          enum7 = 16;
          break;
        }
        case "message-size": {
          enum7 = 17;
          break;
        }
        case "name-too-long": {
          enum7 = 18;
          break;
        }
        case "no-device": {
          enum7 = 19;
          break;
        }
        case "no-entry": {
          enum7 = 20;
          break;
        }
        case "no-lock": {
          enum7 = 21;
          break;
        }
        case "insufficient-memory": {
          enum7 = 22;
          break;
        }
        case "insufficient-space": {
          enum7 = 23;
          break;
        }
        case "not-directory": {
          enum7 = 24;
          break;
        }
        case "not-empty": {
          enum7 = 25;
          break;
        }
        case "not-recoverable": {
          enum7 = 26;
          break;
        }
        case "unsupported": {
          enum7 = 27;
          break;
        }
        case "no-tty": {
          enum7 = 28;
          break;
        }
        case "no-such-device": {
          enum7 = 29;
          break;
        }
        case "overflow": {
          enum7 = 30;
          break;
        }
        case "not-permitted": {
          enum7 = 31;
          break;
        }
        case "pipe": {
          enum7 = 32;
          break;
        }
        case "read-only": {
          enum7 = 33;
          break;
        }
        case "invalid-seek": {
          enum7 = 34;
          break;
        }
        case "text-file-busy": {
          enum7 = 35;
          break;
        }
        case "cross-device": {
          enum7 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val7}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg10 + 1, enum7, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline45(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  var handle6 = arg4;
  var rep7 = handleTable4[(handle6 << 1) + 1] & ~T_FLAG;
  var rsc5 = captureTable4.get(rep7);
  if (!rsc5) {
    rsc5 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc5, symbolRscHandle, {
      writable: true,
      value: handle6,
    });
    Object.defineProperty(rsc5, symbolRscRep, { writable: true, value: rep7 });
  }
  curResourceBorrows.push(rsc5);
  var ptr8 = arg5;
  var len8 = arg6;
  var result8 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr8, len8));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.linkAt(flags3, result4, rsc5, result8) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant10 = ret;
  switch (variant10.tag) {
    case "ok": {
      const e = variant10.val;
      dataView(memory0).setInt8(arg7 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant10.val;
      dataView(memory0).setInt8(arg7 + 0, 1, true);
      var val9 = e;
      let enum9;
      switch (val9) {
        case "access": {
          enum9 = 0;
          break;
        }
        case "would-block": {
          enum9 = 1;
          break;
        }
        case "already": {
          enum9 = 2;
          break;
        }
        case "bad-descriptor": {
          enum9 = 3;
          break;
        }
        case "busy": {
          enum9 = 4;
          break;
        }
        case "deadlock": {
          enum9 = 5;
          break;
        }
        case "quota": {
          enum9 = 6;
          break;
        }
        case "exist": {
          enum9 = 7;
          break;
        }
        case "file-too-large": {
          enum9 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum9 = 9;
          break;
        }
        case "in-progress": {
          enum9 = 10;
          break;
        }
        case "interrupted": {
          enum9 = 11;
          break;
        }
        case "invalid": {
          enum9 = 12;
          break;
        }
        case "io": {
          enum9 = 13;
          break;
        }
        case "is-directory": {
          enum9 = 14;
          break;
        }
        case "loop": {
          enum9 = 15;
          break;
        }
        case "too-many-links": {
          enum9 = 16;
          break;
        }
        case "message-size": {
          enum9 = 17;
          break;
        }
        case "name-too-long": {
          enum9 = 18;
          break;
        }
        case "no-device": {
          enum9 = 19;
          break;
        }
        case "no-entry": {
          enum9 = 20;
          break;
        }
        case "no-lock": {
          enum9 = 21;
          break;
        }
        case "insufficient-memory": {
          enum9 = 22;
          break;
        }
        case "insufficient-space": {
          enum9 = 23;
          break;
        }
        case "not-directory": {
          enum9 = 24;
          break;
        }
        case "not-empty": {
          enum9 = 25;
          break;
        }
        case "not-recoverable": {
          enum9 = 26;
          break;
        }
        case "unsupported": {
          enum9 = 27;
          break;
        }
        case "no-tty": {
          enum9 = 28;
          break;
        }
        case "no-such-device": {
          enum9 = 29;
          break;
        }
        case "overflow": {
          enum9 = 30;
          break;
        }
        case "not-permitted": {
          enum9 = 31;
          break;
        }
        case "pipe": {
          enum9 = 32;
          break;
        }
        case "read-only": {
          enum9 = 33;
          break;
        }
        case "invalid-seek": {
          enum9 = 34;
          break;
        }
        case "text-file-busy": {
          enum9 = 35;
          break;
        }
        case "cross-device": {
          enum9 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val9}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg7 + 1, enum9, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline46(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  if ((arg4 & 4294967280) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags5 = {
    create: Boolean(arg4 & 1),
    directory: Boolean(arg4 & 2),
    exclusive: Boolean(arg4 & 4),
    truncate: Boolean(arg4 & 8),
  };
  if ((arg5 & 4294967232) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags6 = {
    read: Boolean(arg5 & 1),
    write: Boolean(arg5 & 2),
    fileIntegritySync: Boolean(arg5 & 4),
    dataIntegritySync: Boolean(arg5 & 8),
    requestedWriteSync: Boolean(arg5 & 16),
    mutateDirectory: Boolean(arg5 & 32),
  };
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.openAt(flags3, result4, flags5, flags6) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case "ok": {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 0, true);
      if (!(e instanceof Descriptor)) {
        throw new TypeError(
          'Resource error: Not a valid "Descriptor" resource.',
        );
      }
      var handle7 = e[symbolRscHandle];
      if (!handle7) {
        const rep = e[symbolRscRep] || ++captureCnt4;
        captureTable4.set(rep, e);
        handle7 = rscTableCreateOwn(handleTable4, rep);
      }
      dataView(memory0).setInt32(arg6 + 4, handle7, true);
      break;
    }
    case "err": {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case "access": {
          enum8 = 0;
          break;
        }
        case "would-block": {
          enum8 = 1;
          break;
        }
        case "already": {
          enum8 = 2;
          break;
        }
        case "bad-descriptor": {
          enum8 = 3;
          break;
        }
        case "busy": {
          enum8 = 4;
          break;
        }
        case "deadlock": {
          enum8 = 5;
          break;
        }
        case "quota": {
          enum8 = 6;
          break;
        }
        case "exist": {
          enum8 = 7;
          break;
        }
        case "file-too-large": {
          enum8 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum8 = 9;
          break;
        }
        case "in-progress": {
          enum8 = 10;
          break;
        }
        case "interrupted": {
          enum8 = 11;
          break;
        }
        case "invalid": {
          enum8 = 12;
          break;
        }
        case "io": {
          enum8 = 13;
          break;
        }
        case "is-directory": {
          enum8 = 14;
          break;
        }
        case "loop": {
          enum8 = 15;
          break;
        }
        case "too-many-links": {
          enum8 = 16;
          break;
        }
        case "message-size": {
          enum8 = 17;
          break;
        }
        case "name-too-long": {
          enum8 = 18;
          break;
        }
        case "no-device": {
          enum8 = 19;
          break;
        }
        case "no-entry": {
          enum8 = 20;
          break;
        }
        case "no-lock": {
          enum8 = 21;
          break;
        }
        case "insufficient-memory": {
          enum8 = 22;
          break;
        }
        case "insufficient-space": {
          enum8 = 23;
          break;
        }
        case "not-directory": {
          enum8 = 24;
          break;
        }
        case "not-empty": {
          enum8 = 25;
          break;
        }
        case "not-recoverable": {
          enum8 = 26;
          break;
        }
        case "unsupported": {
          enum8 = 27;
          break;
        }
        case "no-tty": {
          enum8 = 28;
          break;
        }
        case "no-such-device": {
          enum8 = 29;
          break;
        }
        case "overflow": {
          enum8 = 30;
          break;
        }
        case "not-permitted": {
          enum8 = 31;
          break;
        }
        case "pipe": {
          enum8 = 32;
          break;
        }
        case "read-only": {
          enum8 = 33;
          break;
        }
        case "invalid-seek": {
          enum8 = 34;
          break;
        }
        case "text-file-busy": {
          enum8 = 35;
          break;
        }
        case "cross-device": {
          enum8 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val8}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg6 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline47(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.readlinkAt(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      var ptr4 = utf8Encode(e, realloc0, memory0);
      var len4 = utf8EncodedLen;
      dataView(memory0).setInt32(arg3 + 8, len4, true);
      dataView(memory0).setInt32(arg3 + 4, ptr4, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case "access": {
          enum5 = 0;
          break;
        }
        case "would-block": {
          enum5 = 1;
          break;
        }
        case "already": {
          enum5 = 2;
          break;
        }
        case "bad-descriptor": {
          enum5 = 3;
          break;
        }
        case "busy": {
          enum5 = 4;
          break;
        }
        case "deadlock": {
          enum5 = 5;
          break;
        }
        case "quota": {
          enum5 = 6;
          break;
        }
        case "exist": {
          enum5 = 7;
          break;
        }
        case "file-too-large": {
          enum5 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum5 = 9;
          break;
        }
        case "in-progress": {
          enum5 = 10;
          break;
        }
        case "interrupted": {
          enum5 = 11;
          break;
        }
        case "invalid": {
          enum5 = 12;
          break;
        }
        case "io": {
          enum5 = 13;
          break;
        }
        case "is-directory": {
          enum5 = 14;
          break;
        }
        case "loop": {
          enum5 = 15;
          break;
        }
        case "too-many-links": {
          enum5 = 16;
          break;
        }
        case "message-size": {
          enum5 = 17;
          break;
        }
        case "name-too-long": {
          enum5 = 18;
          break;
        }
        case "no-device": {
          enum5 = 19;
          break;
        }
        case "no-entry": {
          enum5 = 20;
          break;
        }
        case "no-lock": {
          enum5 = 21;
          break;
        }
        case "insufficient-memory": {
          enum5 = 22;
          break;
        }
        case "insufficient-space": {
          enum5 = 23;
          break;
        }
        case "not-directory": {
          enum5 = 24;
          break;
        }
        case "not-empty": {
          enum5 = 25;
          break;
        }
        case "not-recoverable": {
          enum5 = 26;
          break;
        }
        case "unsupported": {
          enum5 = 27;
          break;
        }
        case "no-tty": {
          enum5 = 28;
          break;
        }
        case "no-such-device": {
          enum5 = 29;
          break;
        }
        case "overflow": {
          enum5 = 30;
          break;
        }
        case "not-permitted": {
          enum5 = 31;
          break;
        }
        case "pipe": {
          enum5 = 32;
          break;
        }
        case "read-only": {
          enum5 = 33;
          break;
        }
        case "invalid-seek": {
          enum5 = 34;
          break;
        }
        case "text-file-busy": {
          enum5 = 35;
          break;
        }
        case "cross-device": {
          enum5 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val5}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg3 + 4, enum5, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline48(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.removeDirectoryAt(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline49(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  var handle5 = arg3;
  var rep6 = handleTable4[(handle5 << 1) + 1] & ~T_FLAG;
  var rsc4 = captureTable4.get(rep6);
  if (!rsc4) {
    rsc4 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc4, symbolRscHandle, {
      writable: true,
      value: handle5,
    });
    Object.defineProperty(rsc4, symbolRscRep, { writable: true, value: rep6 });
  }
  curResourceBorrows.push(rsc4);
  var ptr7 = arg4;
  var len7 = arg5;
  var result7 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr7, len7));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.renameAt(result3, rsc4, result7) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case "ok": {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case "access": {
          enum8 = 0;
          break;
        }
        case "would-block": {
          enum8 = 1;
          break;
        }
        case "already": {
          enum8 = 2;
          break;
        }
        case "bad-descriptor": {
          enum8 = 3;
          break;
        }
        case "busy": {
          enum8 = 4;
          break;
        }
        case "deadlock": {
          enum8 = 5;
          break;
        }
        case "quota": {
          enum8 = 6;
          break;
        }
        case "exist": {
          enum8 = 7;
          break;
        }
        case "file-too-large": {
          enum8 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum8 = 9;
          break;
        }
        case "in-progress": {
          enum8 = 10;
          break;
        }
        case "interrupted": {
          enum8 = 11;
          break;
        }
        case "invalid": {
          enum8 = 12;
          break;
        }
        case "io": {
          enum8 = 13;
          break;
        }
        case "is-directory": {
          enum8 = 14;
          break;
        }
        case "loop": {
          enum8 = 15;
          break;
        }
        case "too-many-links": {
          enum8 = 16;
          break;
        }
        case "message-size": {
          enum8 = 17;
          break;
        }
        case "name-too-long": {
          enum8 = 18;
          break;
        }
        case "no-device": {
          enum8 = 19;
          break;
        }
        case "no-entry": {
          enum8 = 20;
          break;
        }
        case "no-lock": {
          enum8 = 21;
          break;
        }
        case "insufficient-memory": {
          enum8 = 22;
          break;
        }
        case "insufficient-space": {
          enum8 = 23;
          break;
        }
        case "not-directory": {
          enum8 = 24;
          break;
        }
        case "not-empty": {
          enum8 = 25;
          break;
        }
        case "not-recoverable": {
          enum8 = 26;
          break;
        }
        case "unsupported": {
          enum8 = 27;
          break;
        }
        case "no-tty": {
          enum8 = 28;
          break;
        }
        case "no-such-device": {
          enum8 = 29;
          break;
        }
        case "overflow": {
          enum8 = 30;
          break;
        }
        case "not-permitted": {
          enum8 = 31;
          break;
        }
        case "pipe": {
          enum8 = 32;
          break;
        }
        case "read-only": {
          enum8 = 33;
          break;
        }
        case "invalid-seek": {
          enum8 = 34;
          break;
        }
        case "text-file-busy": {
          enum8 = 35;
          break;
        }
        case "cross-device": {
          enum8 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val8}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg6 + 1, enum8, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline50(arg0, arg1, arg2, arg3, arg4, arg5) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  var ptr4 = arg3;
  var len4 = arg4;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.symlinkAt(result3, result4) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case "ok": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg5 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant6.val;
      dataView(memory0).setInt8(arg5 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case "access": {
          enum5 = 0;
          break;
        }
        case "would-block": {
          enum5 = 1;
          break;
        }
        case "already": {
          enum5 = 2;
          break;
        }
        case "bad-descriptor": {
          enum5 = 3;
          break;
        }
        case "busy": {
          enum5 = 4;
          break;
        }
        case "deadlock": {
          enum5 = 5;
          break;
        }
        case "quota": {
          enum5 = 6;
          break;
        }
        case "exist": {
          enum5 = 7;
          break;
        }
        case "file-too-large": {
          enum5 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum5 = 9;
          break;
        }
        case "in-progress": {
          enum5 = 10;
          break;
        }
        case "interrupted": {
          enum5 = 11;
          break;
        }
        case "invalid": {
          enum5 = 12;
          break;
        }
        case "io": {
          enum5 = 13;
          break;
        }
        case "is-directory": {
          enum5 = 14;
          break;
        }
        case "loop": {
          enum5 = 15;
          break;
        }
        case "too-many-links": {
          enum5 = 16;
          break;
        }
        case "message-size": {
          enum5 = 17;
          break;
        }
        case "name-too-long": {
          enum5 = 18;
          break;
        }
        case "no-device": {
          enum5 = 19;
          break;
        }
        case "no-entry": {
          enum5 = 20;
          break;
        }
        case "no-lock": {
          enum5 = 21;
          break;
        }
        case "insufficient-memory": {
          enum5 = 22;
          break;
        }
        case "insufficient-space": {
          enum5 = 23;
          break;
        }
        case "not-directory": {
          enum5 = 24;
          break;
        }
        case "not-empty": {
          enum5 = 25;
          break;
        }
        case "not-recoverable": {
          enum5 = 26;
          break;
        }
        case "unsupported": {
          enum5 = 27;
          break;
        }
        case "no-tty": {
          enum5 = 28;
          break;
        }
        case "no-such-device": {
          enum5 = 29;
          break;
        }
        case "overflow": {
          enum5 = 30;
          break;
        }
        case "not-permitted": {
          enum5 = 31;
          break;
        }
        case "pipe": {
          enum5 = 32;
          break;
        }
        case "read-only": {
          enum5 = 33;
          break;
        }
        case "invalid-seek": {
          enum5 = 34;
          break;
        }
        case "text-file-busy": {
          enum5 = 35;
          break;
        }
        case "cross-device": {
          enum5 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val5}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg5 + 1, enum5, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline51(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.unlinkFileAt(result3) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline52(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.metadataHash() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case "ok": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var { lower: v3_0, upper: v3_1 } = e;
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(v3_0), true);
      dataView(memory0).setBigInt64(arg1 + 16, toUint64(v3_1), true);
      break;
    }
    case "err": {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case "access": {
          enum4 = 0;
          break;
        }
        case "would-block": {
          enum4 = 1;
          break;
        }
        case "already": {
          enum4 = 2;
          break;
        }
        case "bad-descriptor": {
          enum4 = 3;
          break;
        }
        case "busy": {
          enum4 = 4;
          break;
        }
        case "deadlock": {
          enum4 = 5;
          break;
        }
        case "quota": {
          enum4 = 6;
          break;
        }
        case "exist": {
          enum4 = 7;
          break;
        }
        case "file-too-large": {
          enum4 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum4 = 9;
          break;
        }
        case "in-progress": {
          enum4 = 10;
          break;
        }
        case "interrupted": {
          enum4 = 11;
          break;
        }
        case "invalid": {
          enum4 = 12;
          break;
        }
        case "io": {
          enum4 = 13;
          break;
        }
        case "is-directory": {
          enum4 = 14;
          break;
        }
        case "loop": {
          enum4 = 15;
          break;
        }
        case "too-many-links": {
          enum4 = 16;
          break;
        }
        case "message-size": {
          enum4 = 17;
          break;
        }
        case "name-too-long": {
          enum4 = 18;
          break;
        }
        case "no-device": {
          enum4 = 19;
          break;
        }
        case "no-entry": {
          enum4 = 20;
          break;
        }
        case "no-lock": {
          enum4 = 21;
          break;
        }
        case "insufficient-memory": {
          enum4 = 22;
          break;
        }
        case "insufficient-space": {
          enum4 = 23;
          break;
        }
        case "not-directory": {
          enum4 = 24;
          break;
        }
        case "not-empty": {
          enum4 = 25;
          break;
        }
        case "not-recoverable": {
          enum4 = 26;
          break;
        }
        case "unsupported": {
          enum4 = 27;
          break;
        }
        case "no-tty": {
          enum4 = 28;
          break;
        }
        case "no-such-device": {
          enum4 = 29;
          break;
        }
        case "overflow": {
          enum4 = 30;
          break;
        }
        case "not-permitted": {
          enum4 = 31;
          break;
        }
        case "pipe": {
          enum4 = 32;
          break;
        }
        case "read-only": {
          enum4 = 33;
          break;
        }
        case "invalid-seek": {
          enum4 = 34;
          break;
        }
        case "text-file-busy": {
          enum4 = 35;
          break;
        }
        case "cross-device": {
          enum4 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val4}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum4, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline53(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable4.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError("flags have extraneous bits set");
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.metadataHashAt(flags3, result4) };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant7 = ret;
  switch (variant7.tag) {
    case "ok": {
      const e = variant7.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      var { lower: v5_0, upper: v5_1 } = e;
      dataView(memory0).setBigInt64(arg4 + 8, toUint64(v5_0), true);
      dataView(memory0).setBigInt64(arg4 + 16, toUint64(v5_1), true);
      break;
    }
    case "err": {
      const e = variant7.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val6 = e;
      let enum6;
      switch (val6) {
        case "access": {
          enum6 = 0;
          break;
        }
        case "would-block": {
          enum6 = 1;
          break;
        }
        case "already": {
          enum6 = 2;
          break;
        }
        case "bad-descriptor": {
          enum6 = 3;
          break;
        }
        case "busy": {
          enum6 = 4;
          break;
        }
        case "deadlock": {
          enum6 = 5;
          break;
        }
        case "quota": {
          enum6 = 6;
          break;
        }
        case "exist": {
          enum6 = 7;
          break;
        }
        case "file-too-large": {
          enum6 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum6 = 9;
          break;
        }
        case "in-progress": {
          enum6 = 10;
          break;
        }
        case "interrupted": {
          enum6 = 11;
          break;
        }
        case "invalid": {
          enum6 = 12;
          break;
        }
        case "io": {
          enum6 = 13;
          break;
        }
        case "is-directory": {
          enum6 = 14;
          break;
        }
        case "loop": {
          enum6 = 15;
          break;
        }
        case "too-many-links": {
          enum6 = 16;
          break;
        }
        case "message-size": {
          enum6 = 17;
          break;
        }
        case "name-too-long": {
          enum6 = 18;
          break;
        }
        case "no-device": {
          enum6 = 19;
          break;
        }
        case "no-entry": {
          enum6 = 20;
          break;
        }
        case "no-lock": {
          enum6 = 21;
          break;
        }
        case "insufficient-memory": {
          enum6 = 22;
          break;
        }
        case "insufficient-space": {
          enum6 = 23;
          break;
        }
        case "not-directory": {
          enum6 = 24;
          break;
        }
        case "not-empty": {
          enum6 = 25;
          break;
        }
        case "not-recoverable": {
          enum6 = 26;
          break;
        }
        case "unsupported": {
          enum6 = 27;
          break;
        }
        case "no-tty": {
          enum6 = 28;
          break;
        }
        case "no-such-device": {
          enum6 = 29;
          break;
        }
        case "overflow": {
          enum6 = 30;
          break;
        }
        case "not-permitted": {
          enum6 = 31;
          break;
        }
        case "pipe": {
          enum6 = 32;
          break;
        }
        case "read-only": {
          enum6 = 33;
          break;
        }
        case "invalid-seek": {
          enum6 = 34;
          break;
        }
        case "text-file-busy": {
          enum6 = 35;
          break;
        }
        case "cross-device": {
          enum6 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val6}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum6, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline54(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable5[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable5.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(DirectoryEntryStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: "ok", val: rsc0.readDirectoryEntry() };
  } catch (e) {
    ret = { tag: "err", val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case "ok": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant6 = e;
      if (variant6 === null || variant6 === undefined) {
        dataView(memory0).setInt8(arg1 + 4, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(arg1 + 4, 1, true);
        var { type: v3_0, name: v3_1 } = e;
        var val4 = v3_0;
        let enum4;
        switch (val4) {
          case "unknown": {
            enum4 = 0;
            break;
          }
          case "block-device": {
            enum4 = 1;
            break;
          }
          case "character-device": {
            enum4 = 2;
            break;
          }
          case "directory": {
            enum4 = 3;
            break;
          }
          case "fifo": {
            enum4 = 4;
            break;
          }
          case "symbolic-link": {
            enum4 = 5;
            break;
          }
          case "regular-file": {
            enum4 = 6;
            break;
          }
          case "socket": {
            enum4 = 7;
            break;
          }
          default: {
            if (v3_0 instanceof Error) {
              console.error(v3_0);
            }

            throw new TypeError(
              `"${val4}" is not one of the cases of descriptor-type`,
            );
          }
        }
        dataView(memory0).setInt8(arg1 + 8, enum4, true);
        var ptr5 = utf8Encode(v3_1, realloc0, memory0);
        var len5 = utf8EncodedLen;
        dataView(memory0).setInt32(arg1 + 16, len5, true);
        dataView(memory0).setInt32(arg1 + 12, ptr5, true);
      }
      break;
    }
    case "err": {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case "access": {
          enum7 = 0;
          break;
        }
        case "would-block": {
          enum7 = 1;
          break;
        }
        case "already": {
          enum7 = 2;
          break;
        }
        case "bad-descriptor": {
          enum7 = 3;
          break;
        }
        case "busy": {
          enum7 = 4;
          break;
        }
        case "deadlock": {
          enum7 = 5;
          break;
        }
        case "quota": {
          enum7 = 6;
          break;
        }
        case "exist": {
          enum7 = 7;
          break;
        }
        case "file-too-large": {
          enum7 = 8;
          break;
        }
        case "illegal-byte-sequence": {
          enum7 = 9;
          break;
        }
        case "in-progress": {
          enum7 = 10;
          break;
        }
        case "interrupted": {
          enum7 = 11;
          break;
        }
        case "invalid": {
          enum7 = 12;
          break;
        }
        case "io": {
          enum7 = 13;
          break;
        }
        case "is-directory": {
          enum7 = 14;
          break;
        }
        case "loop": {
          enum7 = 15;
          break;
        }
        case "too-many-links": {
          enum7 = 16;
          break;
        }
        case "message-size": {
          enum7 = 17;
          break;
        }
        case "name-too-long": {
          enum7 = 18;
          break;
        }
        case "no-device": {
          enum7 = 19;
          break;
        }
        case "no-entry": {
          enum7 = 20;
          break;
        }
        case "no-lock": {
          enum7 = 21;
          break;
        }
        case "insufficient-memory": {
          enum7 = 22;
          break;
        }
        case "insufficient-space": {
          enum7 = 23;
          break;
        }
        case "not-directory": {
          enum7 = 24;
          break;
        }
        case "not-empty": {
          enum7 = 25;
          break;
        }
        case "not-recoverable": {
          enum7 = 26;
          break;
        }
        case "unsupported": {
          enum7 = 27;
          break;
        }
        case "no-tty": {
          enum7 = 28;
          break;
        }
        case "no-such-device": {
          enum7 = 29;
          break;
        }
        case "overflow": {
          enum7 = 30;
          break;
        }
        case "not-permitted": {
          enum7 = 31;
          break;
        }
        case "pipe": {
          enum7 = 32;
          break;
        }
        case "read-only": {
          enum7 = 33;
          break;
        }
        case "invalid-seek": {
          enum7 = 34;
          break;
        }
        case "text-file-busy": {
          enum7 = 35;
          break;
        }
        case "cross-device": {
          enum7 = 36;
          break;
        }
        default: {
          if (e instanceof Error) {
            console.error(e);
          }

          throw new TypeError(
            `"${val7}" is not one of the cases of error-code`,
          );
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum7, true);
      break;
    }
    default: {
      throw new TypeError("invalid variant specified for result");
    }
  }
}

function trampoline55(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable0[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable0.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Error$1.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, {
      writable: true,
      value: handle1,
    });
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2 });
  }
  curResourceBorrows.push(rsc0);
  const ret = filesystemErrorCode(rsc0);
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  if (variant4 === null || variant4 === undefined) {
    dataView(memory0).setInt8(arg1 + 0, 0, true);
  } else {
    const e = variant4;
    dataView(memory0).setInt8(arg1 + 0, 1, true);
    var val3 = e;
    let enum3;
    switch (val3) {
      case "access": {
        enum3 = 0;
        break;
      }
      case "would-block": {
        enum3 = 1;
        break;
      }
      case "already": {
        enum3 = 2;
        break;
      }
      case "bad-descriptor": {
        enum3 = 3;
        break;
      }
      case "busy": {
        enum3 = 4;
        break;
      }
      case "deadlock": {
        enum3 = 5;
        break;
      }
      case "quota": {
        enum3 = 6;
        break;
      }
      case "exist": {
        enum3 = 7;
        break;
      }
      case "file-too-large": {
        enum3 = 8;
        break;
      }
      case "illegal-byte-sequence": {
        enum3 = 9;
        break;
      }
      case "in-progress": {
        enum3 = 10;
        break;
      }
      case "interrupted": {
        enum3 = 11;
        break;
      }
      case "invalid": {
        enum3 = 12;
        break;
      }
      case "io": {
        enum3 = 13;
        break;
      }
      case "is-directory": {
        enum3 = 14;
        break;
      }
      case "loop": {
        enum3 = 15;
        break;
      }
      case "too-many-links": {
        enum3 = 16;
        break;
      }
      case "message-size": {
        enum3 = 17;
        break;
      }
      case "name-too-long": {
        enum3 = 18;
        break;
      }
      case "no-device": {
        enum3 = 19;
        break;
      }
      case "no-entry": {
        enum3 = 20;
        break;
      }
      case "no-lock": {
        enum3 = 21;
        break;
      }
      case "insufficient-memory": {
        enum3 = 22;
        break;
      }
      case "insufficient-space": {
        enum3 = 23;
        break;
      }
      case "not-directory": {
        enum3 = 24;
        break;
      }
      case "not-empty": {
        enum3 = 25;
        break;
      }
      case "not-recoverable": {
        enum3 = 26;
        break;
      }
      case "unsupported": {
        enum3 = 27;
        break;
      }
      case "no-tty": {
        enum3 = 28;
        break;
      }
      case "no-such-device": {
        enum3 = 29;
        break;
      }
      case "overflow": {
        enum3 = 30;
        break;
      }
      case "not-permitted": {
        enum3 = 31;
        break;
      }
      case "pipe": {
        enum3 = 32;
        break;
      }
      case "read-only": {
        enum3 = 33;
        break;
      }
      case "invalid-seek": {
        enum3 = 34;
        break;
      }
      case "text-file-busy": {
        enum3 = 35;
        break;
      }
      case "cross-device": {
        enum3 = 36;
        break;
      }
      default: {
        if (e instanceof Error) {
          console.error(e);
        }

        throw new TypeError(`"${val3}" is not one of the cases of error-code`);
      }
    }
    dataView(memory0).setInt8(arg1 + 1, enum3, true);
  }
}

function trampoline56(arg0) {
  const ret = getDirectories();
  var vec3 = ret;
  var len3 = vec3.length;
  var result3 = realloc0(0, 0, 4, len3 * 12);
  for (let i = 0; i < vec3.length; i++) {
    const e = vec3[i];
    const base = result3 + i * 12;
    var [tuple0_0, tuple0_1] = e;
    if (!(tuple0_0 instanceof Descriptor)) {
      throw new TypeError('Resource error: Not a valid "Descriptor" resource.');
    }
    var handle1 = tuple0_0[symbolRscHandle];
    if (!handle1) {
      const rep = tuple0_0[symbolRscRep] || ++captureCnt4;
      captureTable4.set(rep, tuple0_0);
      handle1 = rscTableCreateOwn(handleTable4, rep);
    }
    dataView(memory0).setInt32(base + 0, handle1, true);
    var ptr2 = utf8Encode(tuple0_1, realloc0, memory0);
    var len2 = utf8EncodedLen;
    dataView(memory0).setInt32(base + 8, len2, true);
    dataView(memory0).setInt32(base + 4, ptr2, true);
  }
  dataView(memory0).setInt32(arg0 + 4, len3, true);
  dataView(memory0).setInt32(arg0 + 0, result3, true);
}
let exports2;
let exports3;
function trampoline0(handle) {
  const handleEntry = rscTableRemove(handleTable0, handle);
  if (handleEntry.own) {
    const rsc = captureTable0.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable0.delete(handleEntry.rep);
    } else if (Error$1[symbolCabiDispose]) {
      Error$1[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline3(handle) {
  const handleEntry = rscTableRemove(handleTable1, handle);
  if (handleEntry.own) {
    const rsc = captureTable1.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable1.delete(handleEntry.rep);
    } else if (Pollable[symbolCabiDispose]) {
      Pollable[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline6(handle) {
  const handleEntry = rscTableRemove(handleTable2, handle);
  if (handleEntry.own) {
    const rsc = captureTable2.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable2.delete(handleEntry.rep);
    } else if (InputStream[symbolCabiDispose]) {
      InputStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline7(handle) {
  const handleEntry = rscTableRemove(handleTable3, handle);
  if (handleEntry.own) {
    const rsc = captureTable3.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable3.delete(handleEntry.rep);
    } else if (OutputStream[symbolCabiDispose]) {
      OutputStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline9(handle) {
  const handleEntry = rscTableRemove(handleTable4, handle);
  if (handleEntry.own) {
    const rsc = captureTable4.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable4.delete(handleEntry.rep);
    } else if (Descriptor[symbolCabiDispose]) {
      Descriptor[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline10(handle) {
  const handleEntry = rscTableRemove(handleTable5, handle);
  if (handleEntry.own) {
    const rsc = captureTable5.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable5.delete(handleEntry.rep);
    } else if (DirectoryEntryStream[symbolCabiDispose]) {
      DirectoryEntryStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}

const $init = (() => {
  const gen = (function* init() {
    const module0 = base64Compile(
      "AGFzbQEAAAABkAETYAJ/fwBgAX8AYAF/AX9gA39/fwBgA39+fwBgBH9/f38AYAR/f35/AGAFf35+f38AYAh/f35/f35/fwBgBH9+fn8AYAV/f39+fwBgBX9/f39/AGALf39/f39+f39+f38AYAh/f39/f39/fwBgB39/f39/f38AYAZ/f39/f38AYAJ/fwF/YAR/f39/AX9gAAACmBs5GGNtMzJwMnx3YXNpOmlvL2Vycm9yQDAuMh1bbWV0aG9kXWVycm9yLnRvLWRlYnVnLXN0cmluZwAAGGNtMzJwMnx3YXNpOmlvL2Vycm9yQDAuMgplcnJvcl9kcm9wAAEXY20zMnAyfHdhc2k6aW8vcG9sbEAwLjIWW21ldGhvZF1wb2xsYWJsZS5yZWFkeQACF2NtMzJwMnx3YXNpOmlvL3BvbGxAMC4yFlttZXRob2RdcG9sbGFibGUuYmxvY2sAARdjbTMycDJ8d2FzaTppby9wb2xsQDAuMgRwb2xsAAMXY20zMnAyfHdhc2k6aW8vcG9sbEAwLjINcG9sbGFibGVfZHJvcAABGmNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yGVttZXRob2RdaW5wdXQtc3RyZWFtLnJlYWQABBpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMiJbbWV0aG9kXWlucHV0LXN0cmVhbS5ibG9ja2luZy1yZWFkAAQaY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjIZW21ldGhvZF1pbnB1dC1zdHJlYW0uc2tpcAAEGmNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yIlttZXRob2RdaW5wdXQtc3RyZWFtLmJsb2NraW5nLXNraXAABBpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMh5bbWV0aG9kXWlucHV0LXN0cmVhbS5zdWJzY3JpYmUAAhpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMiFbbWV0aG9kXW91dHB1dC1zdHJlYW0uY2hlY2std3JpdGUAABpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMhtbbWV0aG9kXW91dHB1dC1zdHJlYW0ud3JpdGUABRpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi5bbWV0aG9kXW91dHB1dC1zdHJlYW0uYmxvY2tpbmctd3JpdGUtYW5kLWZsdXNoAAUaY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjIbW21ldGhvZF1vdXRwdXQtc3RyZWFtLmZsdXNoAAAaY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjIkW21ldGhvZF1vdXRwdXQtc3RyZWFtLmJsb2NraW5nLWZsdXNoAAAaY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjIfW21ldGhvZF1vdXRwdXQtc3RyZWFtLnN1YnNjcmliZQACGmNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yIlttZXRob2Rdb3V0cHV0LXN0cmVhbS53cml0ZS16ZXJvZXMABBpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMjVbbWV0aG9kXW91dHB1dC1zdHJlYW0uYmxvY2tpbmctd3JpdGUtemVyb2VzLWFuZC1mbHVzaAAEGmNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yHFttZXRob2Rdb3V0cHV0LXN0cmVhbS5zcGxpY2UABhpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMiVbbWV0aG9kXW91dHB1dC1zdHJlYW0uYmxvY2tpbmctc3BsaWNlAAYaY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjIRaW5wdXQtc3RyZWFtX2Ryb3AAARpjbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMhJvdXRwdXQtc3RyZWFtX2Ryb3AAASFjbTMycDJ8d2FzaTpjbG9ja3Mvd2FsbC1jbG9ja0AwLjIDbm93AAEhY20zMnAyfHdhc2k6Y2xvY2tzL3dhbGwtY2xvY2tAMC4yCnJlc29sdXRpb24AASBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiJbbWV0aG9kXWRlc2NyaXB0b3IucmVhZC12aWEtc3RyZWFtAAQgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIjW21ldGhvZF1kZXNjcmlwdG9yLndyaXRlLXZpYS1zdHJlYW0ABCBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiRbbWV0aG9kXWRlc2NyaXB0b3IuYXBwZW5kLXZpYS1zdHJlYW0AACBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhlbbWV0aG9kXWRlc2NyaXB0b3IuYWR2aXNlAAcgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIcW21ldGhvZF1kZXNjcmlwdG9yLnN5bmMtZGF0YQAAIGNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yHFttZXRob2RdZGVzY3JpcHRvci5nZXQtZmxhZ3MAACBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhtbbWV0aG9kXWRlc2NyaXB0b3IuZ2V0LXR5cGUAACBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhtbbWV0aG9kXWRlc2NyaXB0b3Iuc2V0LXNpemUABCBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhxbbWV0aG9kXWRlc2NyaXB0b3Iuc2V0LXRpbWVzAAggY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIXW21ldGhvZF1kZXNjcmlwdG9yLnJlYWQACSBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhhbbWV0aG9kXWRlc2NyaXB0b3Iud3JpdGUACiBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiFbbWV0aG9kXWRlc2NyaXB0b3IucmVhZC1kaXJlY3RvcnkAACBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhdbbWV0aG9kXWRlc2NyaXB0b3Iuc3luYwAAIGNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yJlttZXRob2RdZGVzY3JpcHRvci5jcmVhdGUtZGlyZWN0b3J5LWF0AAUgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIXW21ldGhvZF1kZXNjcmlwdG9yLnN0YXQAACBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhpbbWV0aG9kXWRlc2NyaXB0b3Iuc3RhdC1hdAALIGNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yH1ttZXRob2RdZGVzY3JpcHRvci5zZXQtdGltZXMtYXQADCBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhpbbWV0aG9kXWRlc2NyaXB0b3IubGluay1hdAANIGNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yGlttZXRob2RdZGVzY3JpcHRvci5vcGVuLWF0AA4gY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIeW21ldGhvZF1kZXNjcmlwdG9yLnJlYWRsaW5rLWF0AAUgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjImW21ldGhvZF1kZXNjcmlwdG9yLnJlbW92ZS1kaXJlY3RvcnktYXQABSBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMhxbbWV0aG9kXWRlc2NyaXB0b3IucmVuYW1lLWF0AA4gY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIdW21ldGhvZF1kZXNjcmlwdG9yLnN5bWxpbmstYXQADyBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiFbbWV0aG9kXWRlc2NyaXB0b3IudW5saW5rLWZpbGUtYXQABSBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiFbbWV0aG9kXWRlc2NyaXB0b3IuaXMtc2FtZS1vYmplY3QAECBjbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMiBbbWV0aG9kXWRlc2NyaXB0b3IubWV0YWRhdGEtaGFzaAAAIGNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yI1ttZXRob2RdZGVzY3JpcHRvci5tZXRhZGF0YS1oYXNoLWF0AAsgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIzW21ldGhvZF1kaXJlY3RvcnktZW50cnktc3RyZWFtLnJlYWQtZGlyZWN0b3J5LWVudHJ5AAAgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIVZmlsZXN5c3RlbS1lcnJvci1jb2RlAAAgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIPZGVzY3JpcHRvcl9kcm9wAAEgY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjIbZGlyZWN0b3J5LWVudHJ5LXN0cmVhbV9kcm9wAAEjY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS9wcmVvcGVuc0AwLjIPZ2V0LWRpcmVjdG9yaWVzAAEDAwIREgUDAQAABzYDDWNtMzJwMl9tZW1vcnkCAA5jbTMycDJfcmVhbGxvYwA5EWNtMzJwMl9pbml0aWFsaXplADoKCAIDAAALAgALAC8JcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBDXdpdC1jb21wb25lbnQHMC4yMjAuMA",
    );
    const module1 = base64Compile(
      "AGFzbQEAAAABhAEQYAJ/fwBgA39/fwBgA39+fwBgBH9/f38AYAR/f35/AGABfwBgBX9+fn9/AGAIf39+f39+f38AYAR/fn5/AGAFf39/fn8AYAV/f39/fwBgC39/f39/fn9/fn9/AGAIf39/f39/f38AYAd/f39/f39/AGAHf39/f39/fwBgBn9/f39/fwADLy4AAQICAgIAAwMAAAICBAQFBQICAAYAAAACBwgJAAADAAoLDA0DAw4PAwAKAAAFBAUBcAEuLgfoAS8BMAAAATEAAQEyAAIBMwADATQABAE1AAUBNgAGATcABwE4AAgBOQAJAjEwAAoCMTEACwIxMgAMAjEzAA0CMTQADgIxNQAPAjE2ABACMTcAEQIxOAASAjE5ABMCMjAAFAIyMQAVAjIyABYCMjMAFwIyNAAYAjI1ABkCMjYAGgIyNwAbAjI4ABwCMjkAHQIzMAAeAjMxAB8CMzIAIAIzMwAhAjM0ACICMzUAIwIzNgAkAjM3ACUCMzgAJgIzOQAnAjQwACgCNDEAKQI0MgAqAjQzACsCNDQALAI0NQAtCCRpbXBvcnRzAQAKuQUuCwAgACABQQARAAALDQAgACABIAJBAREBAAsNACAAIAEgAkECEQIACw0AIAAgASACQQMRAgALDQAgACABIAJBBBECAAsNACAAIAEgAkEFEQIACwsAIAAgAUEGEQAACw8AIAAgASACIANBBxEDAAsPACAAIAEgAiADQQgRAwALCwAgACABQQkRAAALCwAgACABQQoRAAALDQAgACABIAJBCxECAAsNACAAIAEgAkEMEQIACw8AIAAgASACIANBDREEAAsPACAAIAEgAiADQQ4RBAALCQAgAEEPEQUACwkAIABBEBEFAAsNACAAIAEgAkEREQIACw0AIAAgASACQRIRAgALCwAgACABQRMRAAALEQAgACABIAIgAyAEQRQRBgALCwAgACABQRURAAALCwAgACABQRYRAAALCwAgACABQRcRAAALDQAgACABIAJBGBECAAsXACAAIAEgAiADIAQgBSAGIAdBGREHAAsPACAAIAEgAiADQRoRCAALEQAgACABIAIgAyAEQRsRCQALCwAgACABQRwRAAALCwAgACABQR0RAAALDwAgACABIAIgA0EeEQMACwsAIAAgAUEfEQAACxEAIAAgASACIAMgBEEgEQoACx0AIAAgASACIAMgBCAFIAYgByAIIAkgCkEhEQsACxcAIAAgASACIAMgBCAFIAYgB0EiEQwACxUAIAAgASACIAMgBCAFIAZBIxENAAsPACAAIAEgAiADQSQRAwALDwAgACABIAIgA0ElEQMACxUAIAAgASACIAMgBCAFIAZBJhEOAAsTACAAIAEgAiADIAQgBUEnEQ8ACw8AIAAgASACIANBKBEDAAsLACAAIAFBKREAAAsRACAAIAEgAiADIARBKhEKAAsLACAAIAFBKxEAAAsLACAAIAFBLBEAAAsJACAAQS0RBQALAC8JcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBDXdpdC1jb21wb25lbnQHMC4yMjAuMADmGQRuYW1lABMSd2l0LWNvbXBvbmVudDpzaGltAckZLgA/aW5kaXJlY3QtY20zMnAyfHdhc2k6aW8vZXJyb3JAMC4yLVttZXRob2RdZXJyb3IudG8tZGVidWctc3RyaW5nASVpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9wb2xsQDAuMi1wb2xsAj1pbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXWlucHV0LXN0cmVhbS5yZWFkA0ZpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXWlucHV0LXN0cmVhbS5ibG9ja2luZy1yZWFkBD1pbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXWlucHV0LXN0cmVhbS5za2lwBUZpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXWlucHV0LXN0cmVhbS5ibG9ja2luZy1za2lwBkVpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXW91dHB1dC1zdHJlYW0uY2hlY2std3JpdGUHP2luZGlyZWN0LWNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yLVttZXRob2Rdb3V0cHV0LXN0cmVhbS53cml0ZQhSaW5kaXJlY3QtY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjItW21ldGhvZF1vdXRwdXQtc3RyZWFtLmJsb2NraW5nLXdyaXRlLWFuZC1mbHVzaAk/aW5kaXJlY3QtY20zMnAyfHdhc2k6aW8vc3RyZWFtc0AwLjItW21ldGhvZF1vdXRwdXQtc3RyZWFtLmZsdXNoCkhpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXW91dHB1dC1zdHJlYW0uYmxvY2tpbmctZmx1c2gLRmluZGlyZWN0LWNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yLVttZXRob2Rdb3V0cHV0LXN0cmVhbS53cml0ZS16ZXJvZXMMWWluZGlyZWN0LWNtMzJwMnx3YXNpOmlvL3N0cmVhbXNAMC4yLVttZXRob2Rdb3V0cHV0LXN0cmVhbS5ibG9ja2luZy13cml0ZS16ZXJvZXMtYW5kLWZsdXNoDUBpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXW91dHB1dC1zdHJlYW0uc3BsaWNlDklpbmRpcmVjdC1jbTMycDJ8d2FzaTppby9zdHJlYW1zQDAuMi1bbWV0aG9kXW91dHB1dC1zdHJlYW0uYmxvY2tpbmctc3BsaWNlDy5pbmRpcmVjdC1jbTMycDJ8d2FzaTpjbG9ja3Mvd2FsbC1jbG9ja0AwLjItbm93EDVpbmRpcmVjdC1jbTMycDJ8d2FzaTpjbG9ja3Mvd2FsbC1jbG9ja0AwLjItcmVzb2x1dGlvbhFMaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnJlYWQtdmlhLXN0cmVhbRJNaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLndyaXRlLXZpYS1zdHJlYW0TTmluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5hcHBlbmQtdmlhLXN0cmVhbRRDaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLmFkdmlzZRVGaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnN5bmMtZGF0YRZGaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLmdldC1mbGFncxdFaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLmdldC10eXBlGEVpbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRlc2NyaXB0b3Iuc2V0LXNpemUZRmluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5zZXQtdGltZXMaQWluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5yZWFkG0JpbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRlc2NyaXB0b3Iud3JpdGUcS2luZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5yZWFkLWRpcmVjdG9yeR1BaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnN5bmMeUGluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5jcmVhdGUtZGlyZWN0b3J5LWF0H0FpbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRlc2NyaXB0b3Iuc3RhdCBEaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnN0YXQtYXQhSWluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5zZXQtdGltZXMtYXQiRGluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5saW5rLWF0I0RpbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRlc2NyaXB0b3Iub3Blbi1hdCRIaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnJlYWRsaW5rLWF0JVBpbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRlc2NyaXB0b3IucmVtb3ZlLWRpcmVjdG9yeS1hdCZGaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnJlbmFtZS1hdCdHaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLnN5bWxpbmstYXQoS2luZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci51bmxpbmstZmlsZS1hdClKaW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS90eXBlc0AwLjItW21ldGhvZF1kZXNjcmlwdG9yLm1ldGFkYXRhLWhhc2gqTWluZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLVttZXRob2RdZGVzY3JpcHRvci5tZXRhZGF0YS1oYXNoLWF0K11pbmRpcmVjdC1jbTMycDJ8d2FzaTpmaWxlc3lzdGVtL3R5cGVzQDAuMi1bbWV0aG9kXWRpcmVjdG9yeS1lbnRyeS1zdHJlYW0ucmVhZC1kaXJlY3RvcnktZW50cnksP2luZGlyZWN0LWNtMzJwMnx3YXNpOmZpbGVzeXN0ZW0vdHlwZXNAMC4yLWZpbGVzeXN0ZW0tZXJyb3ItY29kZS08aW5kaXJlY3QtY20zMnAyfHdhc2k6ZmlsZXN5c3RlbS9wcmVvcGVuc0AwLjItZ2V0LWRpcmVjdG9yaWVz",
    );
    const module2 = base64Compile(
      "AGFzbQEAAAABhAEQYAJ/fwBgA39/fwBgA39+fwBgBH9/f38AYAR/f35/AGABfwBgBX9+fn9/AGAIf39+f39+f38AYAR/fn5/AGAFf39/fn8AYAV/f39/fwBgC39/f39/fn9/fn9/AGAIf39/f39/f38AYAd/f39/f39/AGAHf39/f39/fwBgBn9/f39/fwACmgIvAAEwAAAAATEAAQABMgACAAEzAAIAATQAAgABNQACAAE2AAAAATcAAwABOAADAAE5AAAAAjEwAAAAAjExAAIAAjEyAAIAAjEzAAQAAjE0AAQAAjE1AAUAAjE2AAUAAjE3AAIAAjE4AAIAAjE5AAAAAjIwAAYAAjIxAAAAAjIyAAAAAjIzAAAAAjI0AAIAAjI1AAcAAjI2AAgAAjI3AAkAAjI4AAAAAjI5AAAAAjMwAAMAAjMxAAAAAjMyAAoAAjMzAAsAAjM0AAwAAjM1AA0AAjM2AAMAAjM3AAMAAjM4AA4AAjM5AA8AAjQwAAMAAjQxAAAAAjQyAAoAAjQzAAAAAjQ0AAAAAjQ1AAUACCRpbXBvcnRzAXABLi4JNAEAQQALLgABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0ALwlwcm9kdWNlcnMBDHByb2Nlc3NlZC1ieQENd2l0LWNvbXBvbmVudAcwLjIyMC4wABwEbmFtZQAVFHdpdC1jb21wb25lbnQ6Zml4dXBz",
    );
    const module3 = base64Compile("AGFzbQEAAAABBAFgAAACBQEAAAAACAEA");
    ({ exports: exports0 } = yield instantiateCore(yield module1));
    ({ exports: exports1 } = yield instantiateCore(yield module0, {
      "cm32p2|wasi:clocks/wall-clock@0.2": {
        now: exports0["15"],
        resolution: exports0["16"],
      },
      "cm32p2|wasi:filesystem/preopens@0.2": {
        "get-directories": exports0["45"],
      },
      "cm32p2|wasi:filesystem/types@0.2": {
        "[method]descriptor.advise": exports0["20"],
        "[method]descriptor.append-via-stream": exports0["19"],
        "[method]descriptor.create-directory-at": exports0["30"],
        "[method]descriptor.get-flags": exports0["22"],
        "[method]descriptor.get-type": exports0["23"],
        "[method]descriptor.is-same-object": trampoline8,
        "[method]descriptor.link-at": exports0["34"],
        "[method]descriptor.metadata-hash": exports0["41"],
        "[method]descriptor.metadata-hash-at": exports0["42"],
        "[method]descriptor.open-at": exports0["35"],
        "[method]descriptor.read": exports0["26"],
        "[method]descriptor.read-directory": exports0["28"],
        "[method]descriptor.read-via-stream": exports0["17"],
        "[method]descriptor.readlink-at": exports0["36"],
        "[method]descriptor.remove-directory-at": exports0["37"],
        "[method]descriptor.rename-at": exports0["38"],
        "[method]descriptor.set-size": exports0["24"],
        "[method]descriptor.set-times": exports0["25"],
        "[method]descriptor.set-times-at": exports0["33"],
        "[method]descriptor.stat": exports0["31"],
        "[method]descriptor.stat-at": exports0["32"],
        "[method]descriptor.symlink-at": exports0["39"],
        "[method]descriptor.sync": exports0["29"],
        "[method]descriptor.sync-data": exports0["21"],
        "[method]descriptor.unlink-file-at": exports0["40"],
        "[method]descriptor.write": exports0["27"],
        "[method]descriptor.write-via-stream": exports0["18"],
        "[method]directory-entry-stream.read-directory-entry": exports0["43"],
        descriptor_drop: trampoline9,
        "directory-entry-stream_drop": trampoline10,
        "filesystem-error-code": exports0["44"],
      },
      "cm32p2|wasi:io/error@0.2": {
        "[method]error.to-debug-string": exports0["0"],
        error_drop: trampoline0,
      },
      "cm32p2|wasi:io/poll@0.2": {
        "[method]pollable.block": trampoline2,
        "[method]pollable.ready": trampoline1,
        poll: exports0["1"],
        pollable_drop: trampoline3,
      },
      "cm32p2|wasi:io/streams@0.2": {
        "[method]input-stream.blocking-read": exports0["3"],
        "[method]input-stream.blocking-skip": exports0["5"],
        "[method]input-stream.read": exports0["2"],
        "[method]input-stream.skip": exports0["4"],
        "[method]input-stream.subscribe": trampoline4,
        "[method]output-stream.blocking-flush": exports0["10"],
        "[method]output-stream.blocking-splice": exports0["14"],
        "[method]output-stream.blocking-write-and-flush": exports0["8"],
        "[method]output-stream.blocking-write-zeroes-and-flush": exports0["12"],
        "[method]output-stream.check-write": exports0["6"],
        "[method]output-stream.flush": exports0["9"],
        "[method]output-stream.splice": exports0["13"],
        "[method]output-stream.subscribe": trampoline5,
        "[method]output-stream.write": exports0["7"],
        "[method]output-stream.write-zeroes": exports0["11"],
        "input-stream_drop": trampoline6,
        "output-stream_drop": trampoline7,
      },
    }));
    memory0 = exports1.cm32p2_memory;
    realloc0 = exports1.cm32p2_realloc;
    ({ exports: exports2 } = yield instantiateCore(yield module2, {
      "": {
        $imports: exports0.$imports,
        0: trampoline11,
        1: trampoline12,
        10: trampoline21,
        11: trampoline22,
        12: trampoline23,
        13: trampoline24,
        14: trampoline25,
        15: trampoline26,
        16: trampoline27,
        17: trampoline28,
        18: trampoline29,
        19: trampoline30,
        2: trampoline13,
        20: trampoline31,
        21: trampoline32,
        22: trampoline33,
        23: trampoline34,
        24: trampoline35,
        25: trampoline36,
        26: trampoline37,
        27: trampoline38,
        28: trampoline39,
        29: trampoline40,
        3: trampoline14,
        30: trampoline41,
        31: trampoline42,
        32: trampoline43,
        33: trampoline44,
        34: trampoline45,
        35: trampoline46,
        36: trampoline47,
        37: trampoline48,
        38: trampoline49,
        39: trampoline50,
        4: trampoline15,
        40: trampoline51,
        41: trampoline52,
        42: trampoline53,
        43: trampoline54,
        44: trampoline55,
        45: trampoline56,
        5: trampoline16,
        6: trampoline17,
        7: trampoline18,
        8: trampoline19,
        9: trampoline20,
      },
    }));
    ({ exports: exports3 } = yield instantiateCore(yield module3, {
      "": {
        "": exports1.cm32p2_initialize,
      },
    }));
  })();
  let promise, resolve, reject;
  function runNext(value) {
    try {
      let done;
      do {
        ({ value, done } = gen.next(value));
      } while (!(value instanceof Promise) && !done);
      if (done) {
        if (resolve) resolve(value);
        else return value;
      }
      if (!promise)
        promise = new Promise(
          (_resolve, _reject) => ((resolve = _resolve), (reject = _reject)),
        );
      value.then(runNext, reject);
    } catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }
  const maybeSyncReturn = runNext(null);
  return promise || maybeSyncReturn;
})();

await $init;
