import { getArguments, getEnvironment, initialCwd } from 'wasi:cli/environment';
import { exit } from 'wasi:cli/exit';
import { getStderr } from 'wasi:cli/stderr';
import { getStdin } from 'wasi:cli/stdin';
import { getStdout } from 'wasi:cli/stdout';
import { TerminalInput } from 'wasi:cli/terminal-input';
import { TerminalOutput } from 'wasi:cli/terminal-output';
import { getTerminalStderr } from 'wasi:cli/terminal-stderr';
import { getTerminalStdin } from 'wasi:cli/terminal-stdin';
import { getTerminalStdout } from 'wasi:cli/terminal-stdout';
import { now, resolution, subscribeDuration, subscribeInstant } from 'wasi:clocks/monotonic-clock';
import { now as now$1, resolution as resolution$1 } from 'wasi:clocks/wall-clock';
import { getDirectories } from 'wasi:filesystem/preopens';
import { Descriptor, DirectoryEntryStream, filesystemErrorCode } from 'wasi:filesystem/types';
import { Error as Error$1 } from 'wasi:io/error';
import { Pollable, poll } from 'wasi:io/poll';
import { InputStream, OutputStream } from 'wasi:io/streams';
import { getInsecureRandomBytes, getInsecureRandomU64 } from 'wasi:random/insecure';
import { insecureSeed } from 'wasi:random/insecure-seed';
import { getRandomBytes, getRandomU64 } from 'wasi:random/random';
import { instanceNetwork } from 'wasi:sockets/instance-network';
import { ResolveAddressStream, resolveAddresses } from 'wasi:sockets/ip-name-lookup';
import { Network } from 'wasi:sockets/network';
import { TcpSocket } from 'wasi:sockets/tcp';
import { createTcpSocket } from 'wasi:sockets/tcp-create-socket';
import { IncomingDatagramStream, OutgoingDatagramStream, UdpSocket } from 'wasi:sockets/udp';
import { createUdpSocket } from 'wasi:sockets/udp-create-socket';

const base64Compile = str => WebAssembly.compile(typeof Buffer !== 'undefined' ? Buffer.from(str, 'base64') : Uint8Array.from(atob(str), b => b.charCodeAt(0)));

function clampGuest(i, min, max) {
  if (i < min || i > max) throw new TypeError(`must be between ${min} and ${max}`);
  return i;
}

class ComponentError extends Error {
  constructor (value) {
    const enumerable = typeof value !== 'string';
    super(enumerable ? `${String(value)} (see error.payload)` : value);
    Object.defineProperty(this, 'payload', { value, enumerable });
  }
}

let curResourceBorrows = [];

let dv = new DataView(new ArrayBuffer());
const dataView = mem => dv.buffer === mem.buffer ? dv : dv = new DataView(mem.buffer);

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
let _fs;
async function fetchCompile (url) {
  if (isNode) {
    _fs = _fs || await import('node:fs/promises');
    return WebAssembly.compile(await _fs.readFile(url));
  }
  return fetch(url).then(WebAssembly.compileStreaming);
}

function getErrorPayload(e) {
  if (e && hasOwnProperty.call(e, 'payload')) return e.payload;
  if (e instanceof Error) throw e;
  return e;
}

const handleTables = [];

const hasOwnProperty = Object.prototype.hasOwnProperty;

const instantiateCore = WebAssembly.instantiate;

const T_FLAG = 1 << 30;

function rscTableCreateOwn (table, rep) {
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

function rscTableRemove (table, handle) {
  const scope = table[handle << 1];
  const val = table[(handle << 1) + 1];
  const own = (val & T_FLAG) !== 0;
  const rep = val & ~T_FLAG;
  if (val === 0 || (scope & T_FLAG) !== 0) throw new TypeError('Invalid handle');
  table[handle << 1] = table[0] | T_FLAG;
  table[0] = handle | T_FLAG;
  return { rep, scope, own };
}

const symbolCabiDispose = Symbol.for('cabiDispose');

const symbolRscHandle = Symbol('handle');

const symbolRscRep = Symbol.for('cabiRep');

const symbolDispose = Symbol.dispose || Symbol.for('dispose');

function throwInvalidBool() {
  throw new TypeError('invalid variant discriminant for bool');
}

const toUint64 = val => BigInt.asUintN(64, BigInt(val));

function toUint16(val) {
  val >>>= 0;
  val %= 2 ** 16;
  return val;
}

function toUint32(val) {
  return val >>> 0;
}

function toUint8(val) {
  val >>>= 0;
  val %= 2 ** 8;
  return val;
}

const utf8Decoder = new TextDecoder();

const utf8Encoder = new TextEncoder();

let utf8EncodedLen = 0;
function utf8Encode(s, realloc, memory) {
  if (typeof s !== 'string') throw new TypeError('expected a string');
  if (s.length === 0) {
    utf8EncodedLen = 0;
    return 1;
  }
  let buf = utf8Encoder.encode(s);
  let ptr = realloc(0, 0, 1, buf.length);
  new Uint8Array(memory.buffer).set(buf, ptr);
  utf8EncodedLen = buf.length;
  return ptr;
}


let exports0;

function trampoline0(arg0) {
  let variant0;
  switch (arg0) {
    case 0: {
      variant0= {
        tag: 'ok',
        val: undefined
      };
      break;
    }
    case 1: {
      variant0= {
        tag: 'err',
        val: undefined
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  exit(variant0);
}
const handleTable1 = [T_FLAG, 0];
const captureTable1= new Map();
let captureCnt1 = 0;
handleTables[1] = handleTable1;

function trampoline2(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable1.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Pollable.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.ready();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  return ret ? 1 : 0;
}

function trampoline3(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable1.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Pollable.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  rsc0.block();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
}
const handleTable2 = [T_FLAG, 0];
const captureTable2= new Map();
let captureCnt2 = 0;
handleTables[2] = handleTable2;

function trampoline5(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
const captureTable3= new Map();
let captureCnt3 = 0;
handleTables[3] = handleTable3;

function trampoline6(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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

function trampoline9() {
  const ret = getStdin();
  if (!(ret instanceof InputStream)) {
    throw new TypeError('Resource error: Not a valid "InputStream" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt2;
    captureTable2.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable2, rep);
  }
  return handle0;
}

function trampoline10() {
  const ret = getStdout();
  if (!(ret instanceof OutputStream)) {
    throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt3;
    captureTable3.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable3, rep);
  }
  return handle0;
}

function trampoline11() {
  const ret = getStderr();
  if (!(ret instanceof OutputStream)) {
    throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt3;
    captureTable3.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable3, rep);
  }
  return handle0;
}

function trampoline14() {
  const ret = now();
  return toUint64(ret);
}

function trampoline15() {
  const ret = resolution();
  return toUint64(ret);
}

function trampoline16(arg0) {
  const ret = subscribeInstant(BigInt.asUintN(64, arg0));
  if (!(ret instanceof Pollable)) {
    throw new TypeError('Resource error: Not a valid "Pollable" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt1;
    captureTable1.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable1, rep);
  }
  return handle0;
}

function trampoline17(arg0) {
  const ret = subscribeDuration(BigInt.asUintN(64, arg0));
  if (!(ret instanceof Pollable)) {
    throw new TypeError('Resource error: Not a valid "Pollable" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt1;
    captureTable1.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable1, rep);
  }
  return handle0;
}
const handleTable6 = [T_FLAG, 0];
const captureTable6= new Map();
let captureCnt6 = 0;
handleTables[6] = handleTable6;

function trampoline18(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable6[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable6.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  const ret = rsc0.isSameObject(rsc3);
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  return ret ? 1 : 0;
}
const handleTable8 = [T_FLAG, 0];
const captureTable8= new Map();
let captureCnt8 = 0;
handleTables[8] = handleTable8;

function trampoline22() {
  const ret = instanceNetwork();
  if (!(ret instanceof Network)) {
    throw new TypeError('Resource error: Not a valid "Network" resource.');
  }
  var handle0 = ret[symbolRscHandle];
  if (!handle0) {
    const rep = ret[symbolRscRep] || ++captureCnt8;
    captureTable8.set(rep, ret);
    handle0 = rscTableCreateOwn(handleTable8, rep);
  }
  return handle0;
}
const handleTable9 = [T_FLAG, 0];
const captureTable9= new Map();
let captureCnt9 = 0;
handleTables[9] = handleTable9;

function trampoline23(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.addressFamily();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var val3 = ret;
  let enum3;
  switch (val3) {
    case 'ipv4': {
      enum3 = 0;
      break;
    }
    case 'ipv6': {
      enum3 = 1;
      break;
    }
    default: {
      if ((ret) instanceof Error) {
        console.error(ret);
      }
      
      throw new TypeError(`"${val3}" is not one of the cases of ip-address-family`);
    }
  }
  return enum3;
}

function trampoline24(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
const handleTable10 = [T_FLAG, 0];
const captureTable10= new Map();
let captureCnt10 = 0;
handleTables[10] = handleTable10;

function trampoline25(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable10[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable10.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(IncomingDatagramStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
const handleTable11 = [T_FLAG, 0];
const captureTable11= new Map();
let captureCnt11 = 0;
handleTables[11] = handleTable11;

function trampoline26(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable11[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable11.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutgoingDatagramStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
const handleTable12 = [T_FLAG, 0];
const captureTable12= new Map();
let captureCnt12 = 0;
handleTables[12] = handleTable12;

function trampoline30(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.isListening();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  return ret ? 1 : 0;
}

function trampoline31(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  const ret = rsc0.addressFamily();
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var val3 = ret;
  let enum3;
  switch (val3) {
    case 'ipv4': {
      enum3 = 0;
      break;
    }
    case 'ipv6': {
      enum3 = 1;
      break;
    }
    default: {
      if ((ret) instanceof Error) {
        console.error(ret);
      }
      
      throw new TypeError(`"${val3}" is not one of the cases of ip-address-family`);
    }
  }
  return enum3;
}

function trampoline32(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
const handleTable13 = [T_FLAG, 0];
const captureTable13= new Map();
let captureCnt13 = 0;
handleTables[13] = handleTable13;

function trampoline34(arg0) {
  var handle1 = arg0;
  var rep2 = handleTable13[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable13.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(ResolveAddressStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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

function trampoline36() {
  const ret = getRandomU64();
  return toUint64(ret);
}

function trampoline37() {
  const ret = getInsecureRandomU64();
  return toUint64(ret);
}
let exports1;
let memory0;
let realloc0;

function trampoline38(arg0) {
  const ret = getEnvironment();
  var vec3 = ret;
  var len3 = vec3.length;
  var result3 = realloc0(0, 0, 4, len3 * 16);
  for (let i = 0; i < vec3.length; i++) {
    const e = vec3[i];
    const base = result3 + i * 16;var [tuple0_0, tuple0_1] = e;
    var ptr1 = utf8Encode(tuple0_0, realloc0, memory0);
    var len1 = utf8EncodedLen;
    dataView(memory0).setInt32(base + 4, len1, true);
    dataView(memory0).setInt32(base + 0, ptr1, true);
    var ptr2 = utf8Encode(tuple0_1, realloc0, memory0);
    var len2 = utf8EncodedLen;
    dataView(memory0).setInt32(base + 12, len2, true);
    dataView(memory0).setInt32(base + 8, ptr2, true);
  }
  dataView(memory0).setInt32(arg0 + 4, len3, true);
  dataView(memory0).setInt32(arg0 + 0, result3, true);
}

function trampoline39(arg0) {
  const ret = getArguments();
  var vec1 = ret;
  var len1 = vec1.length;
  var result1 = realloc0(0, 0, 4, len1 * 8);
  for (let i = 0; i < vec1.length; i++) {
    const e = vec1[i];
    const base = result1 + i * 8;var ptr0 = utf8Encode(e, realloc0, memory0);
    var len0 = utf8EncodedLen;
    dataView(memory0).setInt32(base + 4, len0, true);
    dataView(memory0).setInt32(base + 0, ptr0, true);
  }
  dataView(memory0).setInt32(arg0 + 4, len1, true);
  dataView(memory0).setInt32(arg0 + 0, result1, true);
}

function trampoline40(arg0) {
  const ret = initialCwd();
  var variant1 = ret;
  if (variant1 === null || variant1=== undefined) {
    dataView(memory0).setInt8(arg0 + 0, 0, true);
  } else {
    const e = variant1;
    dataView(memory0).setInt8(arg0 + 0, 1, true);
    var ptr0 = utf8Encode(e, realloc0, memory0);
    var len0 = utf8EncodedLen;
    dataView(memory0).setInt32(arg0 + 8, len0, true);
    dataView(memory0).setInt32(arg0 + 4, ptr0, true);
  }
}
const handleTable0 = [T_FLAG, 0];
const captureTable0= new Map();
let captureCnt0 = 0;
handleTables[0] = handleTable0;

function trampoline41(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable0[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable0.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Error$1.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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

function trampoline42(arg0, arg1, arg2) {
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
      Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
      Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
  (new Uint8Array(memory0.buffer, ptr4, len4 * 4)).set(src4);
  dataView(memory0).setInt32(arg2 + 4, len4, true);
  dataView(memory0).setInt32(arg2 + 0, ptr4, true);
}

function trampoline43(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.read(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      var val3 = e;
      var len3 = val3.byteLength;
      var ptr3 = realloc0(0, 0, 1, len3 * 1);
      var src3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, len3 * 1);
      (new Uint8Array(memory0.buffer, ptr3, len3 * 1)).set(src3);
      dataView(memory0).setInt32(arg2 + 8, len3, true);
      dataView(memory0).setInt32(arg2 + 4, ptr3, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case 'last-operation-failed': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline44(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingRead(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      var val3 = e;
      var len3 = val3.byteLength;
      var ptr3 = realloc0(0, 0, 1, len3 * 1);
      var src3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, len3 * 1);
      (new Uint8Array(memory0.buffer, ptr3, len3 * 1)).set(src3);
      dataView(memory0).setInt32(arg2 + 8, len3, true);
      dataView(memory0).setInt32(arg2 + 4, ptr3, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case 'last-operation-failed': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline45(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.skip(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      dataView(memory0).setBigInt64(arg2 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline46(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable2.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingSkip(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      dataView(memory0).setBigInt64(arg2 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline47(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.checkWrite()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg1 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline48(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.write(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case 'last-operation-failed': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg3 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline49(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingWriteAndFlush(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant5 = e;
      switch (variant5.tag) {
        case 'last-operation-failed': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg3 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline50(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.flush()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline51(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingFlush()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline52(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.writeZeroes(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline53(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingWriteZeroesAndFlush(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var variant4 = e;
      switch (variant4.tag) {
        case 'last-operation-failed': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg2 + 4, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg2 + 4, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline54(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable2[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable2.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.splice(rsc3, BigInt.asUintN(64, arg2))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      dataView(memory0).setBigInt64(arg3 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'last-operation-failed': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg3 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg3 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline55(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable3.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutputStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable2[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable2.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(InputStream.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.blockingSplice(rsc3, BigInt.asUintN(64, arg2))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      dataView(memory0).setBigInt64(arg3 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'last-operation-failed': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg3 + 8, 0, true);
          if (!(e instanceof Error$1)) {
            throw new TypeError('Resource error: Not a valid "Error" resource.');
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
        case 'closed': {
          dataView(memory0).setInt8(arg3 + 8, 1, true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`StreamError\``);
        }
      }
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}
const handleTable4 = [T_FLAG, 0];
const captureTable4= new Map();
let captureCnt4 = 0;
handleTables[4] = handleTable4;

function trampoline56(arg0) {
  const ret = getTerminalStdin();
  var variant1 = ret;
  if (variant1 === null || variant1=== undefined) {
    dataView(memory0).setInt8(arg0 + 0, 0, true);
  } else {
    const e = variant1;
    dataView(memory0).setInt8(arg0 + 0, 1, true);
    if (!(e instanceof TerminalInput)) {
      throw new TypeError('Resource error: Not a valid "TerminalInput" resource.');
    }
    var handle0 = e[symbolRscHandle];
    if (!handle0) {
      const rep = e[symbolRscRep] || ++captureCnt4;
      captureTable4.set(rep, e);
      handle0 = rscTableCreateOwn(handleTable4, rep);
    }
    dataView(memory0).setInt32(arg0 + 4, handle0, true);
  }
}
const handleTable5 = [T_FLAG, 0];
const captureTable5= new Map();
let captureCnt5 = 0;
handleTables[5] = handleTable5;

function trampoline57(arg0) {
  const ret = getTerminalStdout();
  var variant1 = ret;
  if (variant1 === null || variant1=== undefined) {
    dataView(memory0).setInt8(arg0 + 0, 0, true);
  } else {
    const e = variant1;
    dataView(memory0).setInt8(arg0 + 0, 1, true);
    if (!(e instanceof TerminalOutput)) {
      throw new TypeError('Resource error: Not a valid "TerminalOutput" resource.');
    }
    var handle0 = e[symbolRscHandle];
    if (!handle0) {
      const rep = e[symbolRscRep] || ++captureCnt5;
      captureTable5.set(rep, e);
      handle0 = rscTableCreateOwn(handleTable5, rep);
    }
    dataView(memory0).setInt32(arg0 + 4, handle0, true);
  }
}

function trampoline58(arg0) {
  const ret = getTerminalStderr();
  var variant1 = ret;
  if (variant1 === null || variant1=== undefined) {
    dataView(memory0).setInt8(arg0 + 0, 0, true);
  } else {
    const e = variant1;
    dataView(memory0).setInt8(arg0 + 0, 1, true);
    if (!(e instanceof TerminalOutput)) {
      throw new TypeError('Resource error: Not a valid "TerminalOutput" resource.');
    }
    var handle0 = e[symbolRscHandle];
    if (!handle0) {
      const rep = e[symbolRscRep] || ++captureCnt5;
      captureTable5.set(rep, e);
      handle0 = rscTableCreateOwn(handleTable5, rep);
    }
    dataView(memory0).setInt32(arg0 + 4, handle0, true);
  }
}

function trampoline59(arg0) {
  const ret = now$1();
  var {seconds: v0_0, nanoseconds: v0_1 } = ret;
  dataView(memory0).setBigInt64(arg0 + 0, toUint64(v0_0), true);
  dataView(memory0).setInt32(arg0 + 8, toUint32(v0_1), true);
}

function trampoline60(arg0) {
  const ret = resolution$1();
  var {seconds: v0_0, nanoseconds: v0_1 } = ret;
  dataView(memory0).setBigInt64(arg0 + 0, toUint64(v0_0), true);
  dataView(memory0).setInt32(arg0 + 8, toUint32(v0_1), true);
}

function trampoline61(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.readViaStream(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      if (!(e instanceof InputStream)) {
        throw new TypeError('Resource error: Not a valid "InputStream" resource.');
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
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline62(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.writeViaStream(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      if (!(e instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
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
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline63(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.appendViaStream()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
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
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline64(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let enum3;
  switch (arg3) {
    case 0: {
      enum3 = 'normal';
      break;
    }
    case 1: {
      enum3 = 'sequential';
      break;
    }
    case 2: {
      enum3 = 'random';
      break;
    }
    case 3: {
      enum3 = 'will-need';
      break;
    }
    case 4: {
      enum3 = 'dont-need';
      break;
    }
    case 5: {
      enum3 = 'no-reuse';
      break;
    }
    default: {
      throw new TypeError('invalid discriminant specified for Advice');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.advise(BigInt.asUintN(64, arg1), BigInt.asUintN(64, arg2), enum3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg4 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline65(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.syncData()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'access': {
          enum3 = 0;
          break;
        }
        case 'would-block': {
          enum3 = 1;
          break;
        }
        case 'already': {
          enum3 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum3 = 3;
          break;
        }
        case 'busy': {
          enum3 = 4;
          break;
        }
        case 'deadlock': {
          enum3 = 5;
          break;
        }
        case 'quota': {
          enum3 = 6;
          break;
        }
        case 'exist': {
          enum3 = 7;
          break;
        }
        case 'file-too-large': {
          enum3 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum3 = 9;
          break;
        }
        case 'in-progress': {
          enum3 = 10;
          break;
        }
        case 'interrupted': {
          enum3 = 11;
          break;
        }
        case 'invalid': {
          enum3 = 12;
          break;
        }
        case 'io': {
          enum3 = 13;
          break;
        }
        case 'is-directory': {
          enum3 = 14;
          break;
        }
        case 'loop': {
          enum3 = 15;
          break;
        }
        case 'too-many-links': {
          enum3 = 16;
          break;
        }
        case 'message-size': {
          enum3 = 17;
          break;
        }
        case 'name-too-long': {
          enum3 = 18;
          break;
        }
        case 'no-device': {
          enum3 = 19;
          break;
        }
        case 'no-entry': {
          enum3 = 20;
          break;
        }
        case 'no-lock': {
          enum3 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum3 = 22;
          break;
        }
        case 'insufficient-space': {
          enum3 = 23;
          break;
        }
        case 'not-directory': {
          enum3 = 24;
          break;
        }
        case 'not-empty': {
          enum3 = 25;
          break;
        }
        case 'not-recoverable': {
          enum3 = 26;
          break;
        }
        case 'unsupported': {
          enum3 = 27;
          break;
        }
        case 'no-tty': {
          enum3 = 28;
          break;
        }
        case 'no-such-device': {
          enum3 = 29;
          break;
        }
        case 'overflow': {
          enum3 = 30;
          break;
        }
        case 'not-permitted': {
          enum3 = 31;
          break;
        }
        case 'pipe': {
          enum3 = 32;
          break;
        }
        case 'read-only': {
          enum3 = 33;
          break;
        }
        case 'invalid-seek': {
          enum3 = 34;
          break;
        }
        case 'text-file-busy': {
          enum3 = 35;
          break;
        }
        case 'cross-device': {
          enum3 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline66(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.getFlags()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      let flags3 = 0;
      if (typeof e === 'object' && e !== null) {
        flags3 = Boolean(e.read) << 0 | Boolean(e.write) << 1 | Boolean(e.fileIntegritySync) << 2 | Boolean(e.dataIntegritySync) << 3 | Boolean(e.requestedWriteSync) << 4 | Boolean(e.mutateDirectory) << 5;
      } else if (e !== null && e!== undefined) {
        throw new TypeError('only an object, undefined or null can be converted to flags');
      }
      dataView(memory0).setInt8(arg1 + 1, flags3, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline67(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.getType()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'block-device': {
          enum3 = 1;
          break;
        }
        case 'character-device': {
          enum3 = 2;
          break;
        }
        case 'directory': {
          enum3 = 3;
          break;
        }
        case 'fifo': {
          enum3 = 4;
          break;
        }
        case 'symbolic-link': {
          enum3 = 5;
          break;
        }
        case 'regular-file': {
          enum3 = 6;
          break;
        }
        case 'socket': {
          enum3 = 7;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of descriptor-type`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline68(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'access': {
          enum3 = 0;
          break;
        }
        case 'would-block': {
          enum3 = 1;
          break;
        }
        case 'already': {
          enum3 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum3 = 3;
          break;
        }
        case 'busy': {
          enum3 = 4;
          break;
        }
        case 'deadlock': {
          enum3 = 5;
          break;
        }
        case 'quota': {
          enum3 = 6;
          break;
        }
        case 'exist': {
          enum3 = 7;
          break;
        }
        case 'file-too-large': {
          enum3 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum3 = 9;
          break;
        }
        case 'in-progress': {
          enum3 = 10;
          break;
        }
        case 'interrupted': {
          enum3 = 11;
          break;
        }
        case 'invalid': {
          enum3 = 12;
          break;
        }
        case 'io': {
          enum3 = 13;
          break;
        }
        case 'is-directory': {
          enum3 = 14;
          break;
        }
        case 'loop': {
          enum3 = 15;
          break;
        }
        case 'too-many-links': {
          enum3 = 16;
          break;
        }
        case 'message-size': {
          enum3 = 17;
          break;
        }
        case 'name-too-long': {
          enum3 = 18;
          break;
        }
        case 'no-device': {
          enum3 = 19;
          break;
        }
        case 'no-entry': {
          enum3 = 20;
          break;
        }
        case 'no-lock': {
          enum3 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum3 = 22;
          break;
        }
        case 'insufficient-space': {
          enum3 = 23;
          break;
        }
        case 'not-directory': {
          enum3 = 24;
          break;
        }
        case 'not-empty': {
          enum3 = 25;
          break;
        }
        case 'not-recoverable': {
          enum3 = 26;
          break;
        }
        case 'unsupported': {
          enum3 = 27;
          break;
        }
        case 'no-tty': {
          enum3 = 28;
          break;
        }
        case 'no-such-device': {
          enum3 = 29;
          break;
        }
        case 'overflow': {
          enum3 = 30;
          break;
        }
        case 'not-permitted': {
          enum3 = 31;
          break;
        }
        case 'pipe': {
          enum3 = 32;
          break;
        }
        case 'read-only': {
          enum3 = 33;
          break;
        }
        case 'invalid-seek': {
          enum3 = 34;
          break;
        }
        case 'text-file-busy': {
          enum3 = 35;
          break;
        }
        case 'cross-device': {
          enum3 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline69(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let variant3;
  switch (arg1) {
    case 0: {
      variant3= {
        tag: 'no-change',
      };
      break;
    }
    case 1: {
      variant3= {
        tag: 'now',
      };
      break;
    }
    case 2: {
      variant3= {
        tag: 'timestamp',
        val: {
          seconds: BigInt.asUintN(64, arg2),
          nanoseconds: arg3 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for NewTimestamp');
    }
  }
  let variant4;
  switch (arg4) {
    case 0: {
      variant4= {
        tag: 'no-change',
      };
      break;
    }
    case 1: {
      variant4= {
        tag: 'now',
      };
      break;
    }
    case 2: {
      variant4= {
        tag: 'timestamp',
        val: {
          seconds: BigInt.asUintN(64, arg5),
          nanoseconds: arg6 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for NewTimestamp');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setTimes(variant3, variant4)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg7 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg7 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case 'access': {
          enum5 = 0;
          break;
        }
        case 'would-block': {
          enum5 = 1;
          break;
        }
        case 'already': {
          enum5 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum5 = 3;
          break;
        }
        case 'busy': {
          enum5 = 4;
          break;
        }
        case 'deadlock': {
          enum5 = 5;
          break;
        }
        case 'quota': {
          enum5 = 6;
          break;
        }
        case 'exist': {
          enum5 = 7;
          break;
        }
        case 'file-too-large': {
          enum5 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum5 = 9;
          break;
        }
        case 'in-progress': {
          enum5 = 10;
          break;
        }
        case 'interrupted': {
          enum5 = 11;
          break;
        }
        case 'invalid': {
          enum5 = 12;
          break;
        }
        case 'io': {
          enum5 = 13;
          break;
        }
        case 'is-directory': {
          enum5 = 14;
          break;
        }
        case 'loop': {
          enum5 = 15;
          break;
        }
        case 'too-many-links': {
          enum5 = 16;
          break;
        }
        case 'message-size': {
          enum5 = 17;
          break;
        }
        case 'name-too-long': {
          enum5 = 18;
          break;
        }
        case 'no-device': {
          enum5 = 19;
          break;
        }
        case 'no-entry': {
          enum5 = 20;
          break;
        }
        case 'no-lock': {
          enum5 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum5 = 22;
          break;
        }
        case 'insufficient-space': {
          enum5 = 23;
          break;
        }
        case 'not-directory': {
          enum5 = 24;
          break;
        }
        case 'not-empty': {
          enum5 = 25;
          break;
        }
        case 'not-recoverable': {
          enum5 = 26;
          break;
        }
        case 'unsupported': {
          enum5 = 27;
          break;
        }
        case 'no-tty': {
          enum5 = 28;
          break;
        }
        case 'no-such-device': {
          enum5 = 29;
          break;
        }
        case 'overflow': {
          enum5 = 30;
          break;
        }
        case 'not-permitted': {
          enum5 = 31;
          break;
        }
        case 'pipe': {
          enum5 = 32;
          break;
        }
        case 'read-only': {
          enum5 = 33;
          break;
        }
        case 'invalid-seek': {
          enum5 = 34;
          break;
        }
        case 'text-file-busy': {
          enum5 = 35;
          break;
        }
        case 'cross-device': {
          enum5 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val5}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg7 + 1, enum5, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline70(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.read(BigInt.asUintN(64, arg1), BigInt.asUintN(64, arg2))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      var [tuple3_0, tuple3_1] = e;
      var val4 = tuple3_0;
      var len4 = val4.byteLength;
      var ptr4 = realloc0(0, 0, 1, len4 * 1);
      var src4 = new Uint8Array(val4.buffer || val4, val4.byteOffset, len4 * 1);
      (new Uint8Array(memory0.buffer, ptr4, len4 * 1)).set(src4);
      dataView(memory0).setInt32(arg3 + 8, len4, true);
      dataView(memory0).setInt32(arg3 + 4, ptr4, true);
      dataView(memory0).setInt8(arg3 + 12, tuple3_1 ? 1 : 0, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case 'access': {
          enum5 = 0;
          break;
        }
        case 'would-block': {
          enum5 = 1;
          break;
        }
        case 'already': {
          enum5 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum5 = 3;
          break;
        }
        case 'busy': {
          enum5 = 4;
          break;
        }
        case 'deadlock': {
          enum5 = 5;
          break;
        }
        case 'quota': {
          enum5 = 6;
          break;
        }
        case 'exist': {
          enum5 = 7;
          break;
        }
        case 'file-too-large': {
          enum5 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum5 = 9;
          break;
        }
        case 'in-progress': {
          enum5 = 10;
          break;
        }
        case 'interrupted': {
          enum5 = 11;
          break;
        }
        case 'invalid': {
          enum5 = 12;
          break;
        }
        case 'io': {
          enum5 = 13;
          break;
        }
        case 'is-directory': {
          enum5 = 14;
          break;
        }
        case 'loop': {
          enum5 = 15;
          break;
        }
        case 'too-many-links': {
          enum5 = 16;
          break;
        }
        case 'message-size': {
          enum5 = 17;
          break;
        }
        case 'name-too-long': {
          enum5 = 18;
          break;
        }
        case 'no-device': {
          enum5 = 19;
          break;
        }
        case 'no-entry': {
          enum5 = 20;
          break;
        }
        case 'no-lock': {
          enum5 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum5 = 22;
          break;
        }
        case 'insufficient-space': {
          enum5 = 23;
          break;
        }
        case 'not-directory': {
          enum5 = 24;
          break;
        }
        case 'not-empty': {
          enum5 = 25;
          break;
        }
        case 'not-recoverable': {
          enum5 = 26;
          break;
        }
        case 'unsupported': {
          enum5 = 27;
          break;
        }
        case 'no-tty': {
          enum5 = 28;
          break;
        }
        case 'no-such-device': {
          enum5 = 29;
          break;
        }
        case 'overflow': {
          enum5 = 30;
          break;
        }
        case 'not-permitted': {
          enum5 = 31;
          break;
        }
        case 'pipe': {
          enum5 = 32;
          break;
        }
        case 'read-only': {
          enum5 = 33;
          break;
        }
        case 'invalid-seek': {
          enum5 = 34;
          break;
        }
        case 'text-file-busy': {
          enum5 = 35;
          break;
        }
        case 'cross-device': {
          enum5 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val5}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 4, enum5, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline71(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.write(result3, BigInt.asUintN(64, arg3))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      dataView(memory0).setBigInt64(arg4 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}
const handleTable7 = [T_FLAG, 0];
const captureTable7= new Map();
let captureCnt7 = 0;
handleTables[7] = handleTable7;

function trampoline72(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.readDirectory()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof DirectoryEntryStream)) {
        throw new TypeError('Resource error: Not a valid "DirectoryEntryStream" resource.');
      }
      var handle3 = e[symbolRscHandle];
      if (!handle3) {
        const rep = e[symbolRscRep] || ++captureCnt7;
        captureTable7.set(rep, e);
        handle3 = rscTableCreateOwn(handleTable7, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle3, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline73(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.sync()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'access': {
          enum3 = 0;
          break;
        }
        case 'would-block': {
          enum3 = 1;
          break;
        }
        case 'already': {
          enum3 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum3 = 3;
          break;
        }
        case 'busy': {
          enum3 = 4;
          break;
        }
        case 'deadlock': {
          enum3 = 5;
          break;
        }
        case 'quota': {
          enum3 = 6;
          break;
        }
        case 'exist': {
          enum3 = 7;
          break;
        }
        case 'file-too-large': {
          enum3 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum3 = 9;
          break;
        }
        case 'in-progress': {
          enum3 = 10;
          break;
        }
        case 'interrupted': {
          enum3 = 11;
          break;
        }
        case 'invalid': {
          enum3 = 12;
          break;
        }
        case 'io': {
          enum3 = 13;
          break;
        }
        case 'is-directory': {
          enum3 = 14;
          break;
        }
        case 'loop': {
          enum3 = 15;
          break;
        }
        case 'too-many-links': {
          enum3 = 16;
          break;
        }
        case 'message-size': {
          enum3 = 17;
          break;
        }
        case 'name-too-long': {
          enum3 = 18;
          break;
        }
        case 'no-device': {
          enum3 = 19;
          break;
        }
        case 'no-entry': {
          enum3 = 20;
          break;
        }
        case 'no-lock': {
          enum3 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum3 = 22;
          break;
        }
        case 'insufficient-space': {
          enum3 = 23;
          break;
        }
        case 'not-directory': {
          enum3 = 24;
          break;
        }
        case 'not-empty': {
          enum3 = 25;
          break;
        }
        case 'not-recoverable': {
          enum3 = 26;
          break;
        }
        case 'unsupported': {
          enum3 = 27;
          break;
        }
        case 'no-tty': {
          enum3 = 28;
          break;
        }
        case 'no-such-device': {
          enum3 = 29;
          break;
        }
        case 'overflow': {
          enum3 = 30;
          break;
        }
        case 'not-permitted': {
          enum3 = 31;
          break;
        }
        case 'pipe': {
          enum3 = 32;
          break;
        }
        case 'read-only': {
          enum3 = 33;
          break;
        }
        case 'invalid-seek': {
          enum3 = 34;
          break;
        }
        case 'text-file-busy': {
          enum3 = 35;
          break;
        }
        case 'cross-device': {
          enum3 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline74(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.createDirectoryAt(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline75(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.stat()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant12 = ret;
  switch (variant12.tag) {
    case 'ok': {
      const e = variant12.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var {type: v3_0, linkCount: v3_1, size: v3_2, dataAccessTimestamp: v3_3, dataModificationTimestamp: v3_4, statusChangeTimestamp: v3_5 } = e;
      var val4 = v3_0;
      let enum4;
      switch (val4) {
        case 'unknown': {
          enum4 = 0;
          break;
        }
        case 'block-device': {
          enum4 = 1;
          break;
        }
        case 'character-device': {
          enum4 = 2;
          break;
        }
        case 'directory': {
          enum4 = 3;
          break;
        }
        case 'fifo': {
          enum4 = 4;
          break;
        }
        case 'symbolic-link': {
          enum4 = 5;
          break;
        }
        case 'regular-file': {
          enum4 = 6;
          break;
        }
        case 'socket': {
          enum4 = 7;
          break;
        }
        default: {
          if ((v3_0) instanceof Error) {
            console.error(v3_0);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of descriptor-type`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum4, true);
      dataView(memory0).setBigInt64(arg1 + 16, toUint64(v3_1), true);
      dataView(memory0).setBigInt64(arg1 + 24, toUint64(v3_2), true);
      var variant6 = v3_3;
      if (variant6 === null || variant6=== undefined) {
        dataView(memory0).setInt8(arg1 + 32, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(arg1 + 32, 1, true);
        var {seconds: v5_0, nanoseconds: v5_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 40, toUint64(v5_0), true);
        dataView(memory0).setInt32(arg1 + 48, toUint32(v5_1), true);
      }
      var variant8 = v3_4;
      if (variant8 === null || variant8=== undefined) {
        dataView(memory0).setInt8(arg1 + 56, 0, true);
      } else {
        const e = variant8;
        dataView(memory0).setInt8(arg1 + 56, 1, true);
        var {seconds: v7_0, nanoseconds: v7_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 64, toUint64(v7_0), true);
        dataView(memory0).setInt32(arg1 + 72, toUint32(v7_1), true);
      }
      var variant10 = v3_5;
      if (variant10 === null || variant10=== undefined) {
        dataView(memory0).setInt8(arg1 + 80, 0, true);
      } else {
        const e = variant10;
        dataView(memory0).setInt8(arg1 + 80, 1, true);
        var {seconds: v9_0, nanoseconds: v9_1 } = e;
        dataView(memory0).setBigInt64(arg1 + 88, toUint64(v9_0), true);
        dataView(memory0).setInt32(arg1 + 96, toUint32(v9_1), true);
      }
      break;
    }
    case 'err': {
      const e = variant12.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val11 = e;
      let enum11;
      switch (val11) {
        case 'access': {
          enum11 = 0;
          break;
        }
        case 'would-block': {
          enum11 = 1;
          break;
        }
        case 'already': {
          enum11 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum11 = 3;
          break;
        }
        case 'busy': {
          enum11 = 4;
          break;
        }
        case 'deadlock': {
          enum11 = 5;
          break;
        }
        case 'quota': {
          enum11 = 6;
          break;
        }
        case 'exist': {
          enum11 = 7;
          break;
        }
        case 'file-too-large': {
          enum11 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum11 = 9;
          break;
        }
        case 'in-progress': {
          enum11 = 10;
          break;
        }
        case 'interrupted': {
          enum11 = 11;
          break;
        }
        case 'invalid': {
          enum11 = 12;
          break;
        }
        case 'io': {
          enum11 = 13;
          break;
        }
        case 'is-directory': {
          enum11 = 14;
          break;
        }
        case 'loop': {
          enum11 = 15;
          break;
        }
        case 'too-many-links': {
          enum11 = 16;
          break;
        }
        case 'message-size': {
          enum11 = 17;
          break;
        }
        case 'name-too-long': {
          enum11 = 18;
          break;
        }
        case 'no-device': {
          enum11 = 19;
          break;
        }
        case 'no-entry': {
          enum11 = 20;
          break;
        }
        case 'no-lock': {
          enum11 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum11 = 22;
          break;
        }
        case 'insufficient-space': {
          enum11 = 23;
          break;
        }
        case 'not-directory': {
          enum11 = 24;
          break;
        }
        case 'not-empty': {
          enum11 = 25;
          break;
        }
        case 'not-recoverable': {
          enum11 = 26;
          break;
        }
        case 'unsupported': {
          enum11 = 27;
          break;
        }
        case 'no-tty': {
          enum11 = 28;
          break;
        }
        case 'no-such-device': {
          enum11 = 29;
          break;
        }
        case 'overflow': {
          enum11 = 30;
          break;
        }
        case 'not-permitted': {
          enum11 = 31;
          break;
        }
        case 'pipe': {
          enum11 = 32;
          break;
        }
        case 'read-only': {
          enum11 = 33;
          break;
        }
        case 'invalid-seek': {
          enum11 = 34;
          break;
        }
        case 'text-file-busy': {
          enum11 = 35;
          break;
        }
        case 'cross-device': {
          enum11 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val11}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum11, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline76(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError('flags have extraneous bits set');
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.statAt(flags3, result4)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant14 = ret;
  switch (variant14.tag) {
    case 'ok': {
      const e = variant14.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      var {type: v5_0, linkCount: v5_1, size: v5_2, dataAccessTimestamp: v5_3, dataModificationTimestamp: v5_4, statusChangeTimestamp: v5_5 } = e;
      var val6 = v5_0;
      let enum6;
      switch (val6) {
        case 'unknown': {
          enum6 = 0;
          break;
        }
        case 'block-device': {
          enum6 = 1;
          break;
        }
        case 'character-device': {
          enum6 = 2;
          break;
        }
        case 'directory': {
          enum6 = 3;
          break;
        }
        case 'fifo': {
          enum6 = 4;
          break;
        }
        case 'symbolic-link': {
          enum6 = 5;
          break;
        }
        case 'regular-file': {
          enum6 = 6;
          break;
        }
        case 'socket': {
          enum6 = 7;
          break;
        }
        default: {
          if ((v5_0) instanceof Error) {
            console.error(v5_0);
          }
          
          throw new TypeError(`"${val6}" is not one of the cases of descriptor-type`);
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum6, true);
      dataView(memory0).setBigInt64(arg4 + 16, toUint64(v5_1), true);
      dataView(memory0).setBigInt64(arg4 + 24, toUint64(v5_2), true);
      var variant8 = v5_3;
      if (variant8 === null || variant8=== undefined) {
        dataView(memory0).setInt8(arg4 + 32, 0, true);
      } else {
        const e = variant8;
        dataView(memory0).setInt8(arg4 + 32, 1, true);
        var {seconds: v7_0, nanoseconds: v7_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 40, toUint64(v7_0), true);
        dataView(memory0).setInt32(arg4 + 48, toUint32(v7_1), true);
      }
      var variant10 = v5_4;
      if (variant10 === null || variant10=== undefined) {
        dataView(memory0).setInt8(arg4 + 56, 0, true);
      } else {
        const e = variant10;
        dataView(memory0).setInt8(arg4 + 56, 1, true);
        var {seconds: v9_0, nanoseconds: v9_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 64, toUint64(v9_0), true);
        dataView(memory0).setInt32(arg4 + 72, toUint32(v9_1), true);
      }
      var variant12 = v5_5;
      if (variant12 === null || variant12=== undefined) {
        dataView(memory0).setInt8(arg4 + 80, 0, true);
      } else {
        const e = variant12;
        dataView(memory0).setInt8(arg4 + 80, 1, true);
        var {seconds: v11_0, nanoseconds: v11_1 } = e;
        dataView(memory0).setBigInt64(arg4 + 88, toUint64(v11_0), true);
        dataView(memory0).setInt32(arg4 + 96, toUint32(v11_1), true);
      }
      break;
    }
    case 'err': {
      const e = variant14.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val13 = e;
      let enum13;
      switch (val13) {
        case 'access': {
          enum13 = 0;
          break;
        }
        case 'would-block': {
          enum13 = 1;
          break;
        }
        case 'already': {
          enum13 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum13 = 3;
          break;
        }
        case 'busy': {
          enum13 = 4;
          break;
        }
        case 'deadlock': {
          enum13 = 5;
          break;
        }
        case 'quota': {
          enum13 = 6;
          break;
        }
        case 'exist': {
          enum13 = 7;
          break;
        }
        case 'file-too-large': {
          enum13 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum13 = 9;
          break;
        }
        case 'in-progress': {
          enum13 = 10;
          break;
        }
        case 'interrupted': {
          enum13 = 11;
          break;
        }
        case 'invalid': {
          enum13 = 12;
          break;
        }
        case 'io': {
          enum13 = 13;
          break;
        }
        case 'is-directory': {
          enum13 = 14;
          break;
        }
        case 'loop': {
          enum13 = 15;
          break;
        }
        case 'too-many-links': {
          enum13 = 16;
          break;
        }
        case 'message-size': {
          enum13 = 17;
          break;
        }
        case 'name-too-long': {
          enum13 = 18;
          break;
        }
        case 'no-device': {
          enum13 = 19;
          break;
        }
        case 'no-entry': {
          enum13 = 20;
          break;
        }
        case 'no-lock': {
          enum13 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum13 = 22;
          break;
        }
        case 'insufficient-space': {
          enum13 = 23;
          break;
        }
        case 'not-directory': {
          enum13 = 24;
          break;
        }
        case 'not-empty': {
          enum13 = 25;
          break;
        }
        case 'not-recoverable': {
          enum13 = 26;
          break;
        }
        case 'unsupported': {
          enum13 = 27;
          break;
        }
        case 'no-tty': {
          enum13 = 28;
          break;
        }
        case 'no-such-device': {
          enum13 = 29;
          break;
        }
        case 'overflow': {
          enum13 = 30;
          break;
        }
        case 'not-permitted': {
          enum13 = 31;
          break;
        }
        case 'pipe': {
          enum13 = 32;
          break;
        }
        case 'read-only': {
          enum13 = 33;
          break;
        }
        case 'invalid-seek': {
          enum13 = 34;
          break;
        }
        case 'text-file-busy': {
          enum13 = 35;
          break;
        }
        case 'cross-device': {
          enum13 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val13}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum13, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline77(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError('flags have extraneous bits set');
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
      variant5= {
        tag: 'no-change',
      };
      break;
    }
    case 1: {
      variant5= {
        tag: 'now',
      };
      break;
    }
    case 2: {
      variant5= {
        tag: 'timestamp',
        val: {
          seconds: BigInt.asUintN(64, arg5),
          nanoseconds: arg6 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for NewTimestamp');
    }
  }
  let variant6;
  switch (arg7) {
    case 0: {
      variant6= {
        tag: 'no-change',
      };
      break;
    }
    case 1: {
      variant6= {
        tag: 'now',
      };
      break;
    }
    case 2: {
      variant6= {
        tag: 'timestamp',
        val: {
          seconds: BigInt.asUintN(64, arg8),
          nanoseconds: arg9 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for NewTimestamp');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setTimesAt(flags3, result4, variant5, variant6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg10 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg10 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'access': {
          enum7 = 0;
          break;
        }
        case 'would-block': {
          enum7 = 1;
          break;
        }
        case 'already': {
          enum7 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum7 = 3;
          break;
        }
        case 'busy': {
          enum7 = 4;
          break;
        }
        case 'deadlock': {
          enum7 = 5;
          break;
        }
        case 'quota': {
          enum7 = 6;
          break;
        }
        case 'exist': {
          enum7 = 7;
          break;
        }
        case 'file-too-large': {
          enum7 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum7 = 9;
          break;
        }
        case 'in-progress': {
          enum7 = 10;
          break;
        }
        case 'interrupted': {
          enum7 = 11;
          break;
        }
        case 'invalid': {
          enum7 = 12;
          break;
        }
        case 'io': {
          enum7 = 13;
          break;
        }
        case 'is-directory': {
          enum7 = 14;
          break;
        }
        case 'loop': {
          enum7 = 15;
          break;
        }
        case 'too-many-links': {
          enum7 = 16;
          break;
        }
        case 'message-size': {
          enum7 = 17;
          break;
        }
        case 'name-too-long': {
          enum7 = 18;
          break;
        }
        case 'no-device': {
          enum7 = 19;
          break;
        }
        case 'no-entry': {
          enum7 = 20;
          break;
        }
        case 'no-lock': {
          enum7 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum7 = 22;
          break;
        }
        case 'insufficient-space': {
          enum7 = 23;
          break;
        }
        case 'not-directory': {
          enum7 = 24;
          break;
        }
        case 'not-empty': {
          enum7 = 25;
          break;
        }
        case 'not-recoverable': {
          enum7 = 26;
          break;
        }
        case 'unsupported': {
          enum7 = 27;
          break;
        }
        case 'no-tty': {
          enum7 = 28;
          break;
        }
        case 'no-such-device': {
          enum7 = 29;
          break;
        }
        case 'overflow': {
          enum7 = 30;
          break;
        }
        case 'not-permitted': {
          enum7 = 31;
          break;
        }
        case 'pipe': {
          enum7 = 32;
          break;
        }
        case 'read-only': {
          enum7 = 33;
          break;
        }
        case 'invalid-seek': {
          enum7 = 34;
          break;
        }
        case 'text-file-busy': {
          enum7 = 35;
          break;
        }
        case 'cross-device': {
          enum7 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg10 + 1, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline78(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError('flags have extraneous bits set');
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  var handle6 = arg4;
  var rep7 = handleTable6[(handle6 << 1) + 1] & ~T_FLAG;
  var rsc5 = captureTable6.get(rep7);
  if (!rsc5) {
    rsc5 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc5, symbolRscHandle, { writable: true, value: handle6});
    Object.defineProperty(rsc5, symbolRscRep, { writable: true, value: rep7});
  }
  curResourceBorrows.push(rsc5);
  var ptr8 = arg5;
  var len8 = arg6;
  var result8 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr8, len8));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.linkAt(flags3, result4, rsc5, result8)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant10 = ret;
  switch (variant10.tag) {
    case 'ok': {
      const e = variant10.val;
      dataView(memory0).setInt8(arg7 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant10.val;
      dataView(memory0).setInt8(arg7 + 0, 1, true);
      var val9 = e;
      let enum9;
      switch (val9) {
        case 'access': {
          enum9 = 0;
          break;
        }
        case 'would-block': {
          enum9 = 1;
          break;
        }
        case 'already': {
          enum9 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum9 = 3;
          break;
        }
        case 'busy': {
          enum9 = 4;
          break;
        }
        case 'deadlock': {
          enum9 = 5;
          break;
        }
        case 'quota': {
          enum9 = 6;
          break;
        }
        case 'exist': {
          enum9 = 7;
          break;
        }
        case 'file-too-large': {
          enum9 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum9 = 9;
          break;
        }
        case 'in-progress': {
          enum9 = 10;
          break;
        }
        case 'interrupted': {
          enum9 = 11;
          break;
        }
        case 'invalid': {
          enum9 = 12;
          break;
        }
        case 'io': {
          enum9 = 13;
          break;
        }
        case 'is-directory': {
          enum9 = 14;
          break;
        }
        case 'loop': {
          enum9 = 15;
          break;
        }
        case 'too-many-links': {
          enum9 = 16;
          break;
        }
        case 'message-size': {
          enum9 = 17;
          break;
        }
        case 'name-too-long': {
          enum9 = 18;
          break;
        }
        case 'no-device': {
          enum9 = 19;
          break;
        }
        case 'no-entry': {
          enum9 = 20;
          break;
        }
        case 'no-lock': {
          enum9 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum9 = 22;
          break;
        }
        case 'insufficient-space': {
          enum9 = 23;
          break;
        }
        case 'not-directory': {
          enum9 = 24;
          break;
        }
        case 'not-empty': {
          enum9 = 25;
          break;
        }
        case 'not-recoverable': {
          enum9 = 26;
          break;
        }
        case 'unsupported': {
          enum9 = 27;
          break;
        }
        case 'no-tty': {
          enum9 = 28;
          break;
        }
        case 'no-such-device': {
          enum9 = 29;
          break;
        }
        case 'overflow': {
          enum9 = 30;
          break;
        }
        case 'not-permitted': {
          enum9 = 31;
          break;
        }
        case 'pipe': {
          enum9 = 32;
          break;
        }
        case 'read-only': {
          enum9 = 33;
          break;
        }
        case 'invalid-seek': {
          enum9 = 34;
          break;
        }
        case 'text-file-busy': {
          enum9 = 35;
          break;
        }
        case 'cross-device': {
          enum9 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val9}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg7 + 1, enum9, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline79(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError('flags have extraneous bits set');
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  if ((arg4 & 4294967280) !== 0) {
    throw new TypeError('flags have extraneous bits set');
  }
  var flags5 = {
    create: Boolean(arg4 & 1),
    directory: Boolean(arg4 & 2),
    exclusive: Boolean(arg4 & 4),
    truncate: Boolean(arg4 & 8),
  };
  if ((arg5 & 4294967232) !== 0) {
    throw new TypeError('flags have extraneous bits set');
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
    ret = { tag: 'ok', val: rsc0.openAt(flags3, result4, flags5, flags6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 0, true);
      if (!(e instanceof Descriptor)) {
        throw new TypeError('Resource error: Not a valid "Descriptor" resource.');
      }
      var handle7 = e[symbolRscHandle];
      if (!handle7) {
        const rep = e[symbolRscRep] || ++captureCnt6;
        captureTable6.set(rep, e);
        handle7 = rscTableCreateOwn(handleTable6, rep);
      }
      dataView(memory0).setInt32(arg6 + 4, handle7, true);
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'access': {
          enum8 = 0;
          break;
        }
        case 'would-block': {
          enum8 = 1;
          break;
        }
        case 'already': {
          enum8 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum8 = 3;
          break;
        }
        case 'busy': {
          enum8 = 4;
          break;
        }
        case 'deadlock': {
          enum8 = 5;
          break;
        }
        case 'quota': {
          enum8 = 6;
          break;
        }
        case 'exist': {
          enum8 = 7;
          break;
        }
        case 'file-too-large': {
          enum8 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum8 = 9;
          break;
        }
        case 'in-progress': {
          enum8 = 10;
          break;
        }
        case 'interrupted': {
          enum8 = 11;
          break;
        }
        case 'invalid': {
          enum8 = 12;
          break;
        }
        case 'io': {
          enum8 = 13;
          break;
        }
        case 'is-directory': {
          enum8 = 14;
          break;
        }
        case 'loop': {
          enum8 = 15;
          break;
        }
        case 'too-many-links': {
          enum8 = 16;
          break;
        }
        case 'message-size': {
          enum8 = 17;
          break;
        }
        case 'name-too-long': {
          enum8 = 18;
          break;
        }
        case 'no-device': {
          enum8 = 19;
          break;
        }
        case 'no-entry': {
          enum8 = 20;
          break;
        }
        case 'no-lock': {
          enum8 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum8 = 22;
          break;
        }
        case 'insufficient-space': {
          enum8 = 23;
          break;
        }
        case 'not-directory': {
          enum8 = 24;
          break;
        }
        case 'not-empty': {
          enum8 = 25;
          break;
        }
        case 'not-recoverable': {
          enum8 = 26;
          break;
        }
        case 'unsupported': {
          enum8 = 27;
          break;
        }
        case 'no-tty': {
          enum8 = 28;
          break;
        }
        case 'no-such-device': {
          enum8 = 29;
          break;
        }
        case 'overflow': {
          enum8 = 30;
          break;
        }
        case 'not-permitted': {
          enum8 = 31;
          break;
        }
        case 'pipe': {
          enum8 = 32;
          break;
        }
        case 'read-only': {
          enum8 = 33;
          break;
        }
        case 'invalid-seek': {
          enum8 = 34;
          break;
        }
        case 'text-file-busy': {
          enum8 = 35;
          break;
        }
        case 'cross-device': {
          enum8 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg6 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline80(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.readlinkAt(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      var ptr4 = utf8Encode(e, realloc0, memory0);
      var len4 = utf8EncodedLen;
      dataView(memory0).setInt32(arg3 + 8, len4, true);
      dataView(memory0).setInt32(arg3 + 4, ptr4, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case 'access': {
          enum5 = 0;
          break;
        }
        case 'would-block': {
          enum5 = 1;
          break;
        }
        case 'already': {
          enum5 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum5 = 3;
          break;
        }
        case 'busy': {
          enum5 = 4;
          break;
        }
        case 'deadlock': {
          enum5 = 5;
          break;
        }
        case 'quota': {
          enum5 = 6;
          break;
        }
        case 'exist': {
          enum5 = 7;
          break;
        }
        case 'file-too-large': {
          enum5 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum5 = 9;
          break;
        }
        case 'in-progress': {
          enum5 = 10;
          break;
        }
        case 'interrupted': {
          enum5 = 11;
          break;
        }
        case 'invalid': {
          enum5 = 12;
          break;
        }
        case 'io': {
          enum5 = 13;
          break;
        }
        case 'is-directory': {
          enum5 = 14;
          break;
        }
        case 'loop': {
          enum5 = 15;
          break;
        }
        case 'too-many-links': {
          enum5 = 16;
          break;
        }
        case 'message-size': {
          enum5 = 17;
          break;
        }
        case 'name-too-long': {
          enum5 = 18;
          break;
        }
        case 'no-device': {
          enum5 = 19;
          break;
        }
        case 'no-entry': {
          enum5 = 20;
          break;
        }
        case 'no-lock': {
          enum5 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum5 = 22;
          break;
        }
        case 'insufficient-space': {
          enum5 = 23;
          break;
        }
        case 'not-directory': {
          enum5 = 24;
          break;
        }
        case 'not-empty': {
          enum5 = 25;
          break;
        }
        case 'not-recoverable': {
          enum5 = 26;
          break;
        }
        case 'unsupported': {
          enum5 = 27;
          break;
        }
        case 'no-tty': {
          enum5 = 28;
          break;
        }
        case 'no-such-device': {
          enum5 = 29;
          break;
        }
        case 'overflow': {
          enum5 = 30;
          break;
        }
        case 'not-permitted': {
          enum5 = 31;
          break;
        }
        case 'pipe': {
          enum5 = 32;
          break;
        }
        case 'read-only': {
          enum5 = 33;
          break;
        }
        case 'invalid-seek': {
          enum5 = 34;
          break;
        }
        case 'text-file-busy': {
          enum5 = 35;
          break;
        }
        case 'cross-device': {
          enum5 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val5}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 4, enum5, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline81(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.removeDirectoryAt(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline82(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  var handle5 = arg3;
  var rep6 = handleTable6[(handle5 << 1) + 1] & ~T_FLAG;
  var rsc4 = captureTable6.get(rep6);
  if (!rsc4) {
    rsc4 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc4, symbolRscHandle, { writable: true, value: handle5});
    Object.defineProperty(rsc4, symbolRscRep, { writable: true, value: rep6});
  }
  curResourceBorrows.push(rsc4);
  var ptr7 = arg4;
  var len7 = arg5;
  var result7 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr7, len7));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.renameAt(result3, rsc4, result7)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg6 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'access': {
          enum8 = 0;
          break;
        }
        case 'would-block': {
          enum8 = 1;
          break;
        }
        case 'already': {
          enum8 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum8 = 3;
          break;
        }
        case 'busy': {
          enum8 = 4;
          break;
        }
        case 'deadlock': {
          enum8 = 5;
          break;
        }
        case 'quota': {
          enum8 = 6;
          break;
        }
        case 'exist': {
          enum8 = 7;
          break;
        }
        case 'file-too-large': {
          enum8 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum8 = 9;
          break;
        }
        case 'in-progress': {
          enum8 = 10;
          break;
        }
        case 'interrupted': {
          enum8 = 11;
          break;
        }
        case 'invalid': {
          enum8 = 12;
          break;
        }
        case 'io': {
          enum8 = 13;
          break;
        }
        case 'is-directory': {
          enum8 = 14;
          break;
        }
        case 'loop': {
          enum8 = 15;
          break;
        }
        case 'too-many-links': {
          enum8 = 16;
          break;
        }
        case 'message-size': {
          enum8 = 17;
          break;
        }
        case 'name-too-long': {
          enum8 = 18;
          break;
        }
        case 'no-device': {
          enum8 = 19;
          break;
        }
        case 'no-entry': {
          enum8 = 20;
          break;
        }
        case 'no-lock': {
          enum8 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum8 = 22;
          break;
        }
        case 'insufficient-space': {
          enum8 = 23;
          break;
        }
        case 'not-directory': {
          enum8 = 24;
          break;
        }
        case 'not-empty': {
          enum8 = 25;
          break;
        }
        case 'not-recoverable': {
          enum8 = 26;
          break;
        }
        case 'unsupported': {
          enum8 = 27;
          break;
        }
        case 'no-tty': {
          enum8 = 28;
          break;
        }
        case 'no-such-device': {
          enum8 = 29;
          break;
        }
        case 'overflow': {
          enum8 = 30;
          break;
        }
        case 'not-permitted': {
          enum8 = 31;
          break;
        }
        case 'pipe': {
          enum8 = 32;
          break;
        }
        case 'read-only': {
          enum8 = 33;
          break;
        }
        case 'invalid-seek': {
          enum8 = 34;
          break;
        }
        case 'text-file-busy': {
          enum8 = 35;
          break;
        }
        case 'cross-device': {
          enum8 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg6 + 1, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline83(arg0, arg1, arg2, arg3, arg4, arg5) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
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
    ret = { tag: 'ok', val: rsc0.symlinkAt(result3, result4)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg5 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg5 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case 'access': {
          enum5 = 0;
          break;
        }
        case 'would-block': {
          enum5 = 1;
          break;
        }
        case 'already': {
          enum5 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum5 = 3;
          break;
        }
        case 'busy': {
          enum5 = 4;
          break;
        }
        case 'deadlock': {
          enum5 = 5;
          break;
        }
        case 'quota': {
          enum5 = 6;
          break;
        }
        case 'exist': {
          enum5 = 7;
          break;
        }
        case 'file-too-large': {
          enum5 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum5 = 9;
          break;
        }
        case 'in-progress': {
          enum5 = 10;
          break;
        }
        case 'interrupted': {
          enum5 = 11;
          break;
        }
        case 'invalid': {
          enum5 = 12;
          break;
        }
        case 'io': {
          enum5 = 13;
          break;
        }
        case 'is-directory': {
          enum5 = 14;
          break;
        }
        case 'loop': {
          enum5 = 15;
          break;
        }
        case 'too-many-links': {
          enum5 = 16;
          break;
        }
        case 'message-size': {
          enum5 = 17;
          break;
        }
        case 'name-too-long': {
          enum5 = 18;
          break;
        }
        case 'no-device': {
          enum5 = 19;
          break;
        }
        case 'no-entry': {
          enum5 = 20;
          break;
        }
        case 'no-lock': {
          enum5 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum5 = 22;
          break;
        }
        case 'insufficient-space': {
          enum5 = 23;
          break;
        }
        case 'not-directory': {
          enum5 = 24;
          break;
        }
        case 'not-empty': {
          enum5 = 25;
          break;
        }
        case 'not-recoverable': {
          enum5 = 26;
          break;
        }
        case 'unsupported': {
          enum5 = 27;
          break;
        }
        case 'no-tty': {
          enum5 = 28;
          break;
        }
        case 'no-such-device': {
          enum5 = 29;
          break;
        }
        case 'overflow': {
          enum5 = 30;
          break;
        }
        case 'not-permitted': {
          enum5 = 31;
          break;
        }
        case 'pipe': {
          enum5 = 32;
          break;
        }
        case 'read-only': {
          enum5 = 33;
          break;
        }
        case 'invalid-seek': {
          enum5 = 34;
          break;
        }
        case 'text-file-busy': {
          enum5 = 35;
          break;
        }
        case 'cross-device': {
          enum5 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val5}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg5 + 1, enum5, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline84(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.unlinkFileAt(result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline85(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.metadataHash()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var {lower: v3_0, upper: v3_1 } = e;
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(v3_0), true);
      dataView(memory0).setBigInt64(arg1 + 16, toUint64(v3_1), true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'access': {
          enum4 = 0;
          break;
        }
        case 'would-block': {
          enum4 = 1;
          break;
        }
        case 'already': {
          enum4 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum4 = 3;
          break;
        }
        case 'busy': {
          enum4 = 4;
          break;
        }
        case 'deadlock': {
          enum4 = 5;
          break;
        }
        case 'quota': {
          enum4 = 6;
          break;
        }
        case 'exist': {
          enum4 = 7;
          break;
        }
        case 'file-too-large': {
          enum4 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum4 = 9;
          break;
        }
        case 'in-progress': {
          enum4 = 10;
          break;
        }
        case 'interrupted': {
          enum4 = 11;
          break;
        }
        case 'invalid': {
          enum4 = 12;
          break;
        }
        case 'io': {
          enum4 = 13;
          break;
        }
        case 'is-directory': {
          enum4 = 14;
          break;
        }
        case 'loop': {
          enum4 = 15;
          break;
        }
        case 'too-many-links': {
          enum4 = 16;
          break;
        }
        case 'message-size': {
          enum4 = 17;
          break;
        }
        case 'name-too-long': {
          enum4 = 18;
          break;
        }
        case 'no-device': {
          enum4 = 19;
          break;
        }
        case 'no-entry': {
          enum4 = 20;
          break;
        }
        case 'no-lock': {
          enum4 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum4 = 22;
          break;
        }
        case 'insufficient-space': {
          enum4 = 23;
          break;
        }
        case 'not-directory': {
          enum4 = 24;
          break;
        }
        case 'not-empty': {
          enum4 = 25;
          break;
        }
        case 'not-recoverable': {
          enum4 = 26;
          break;
        }
        case 'unsupported': {
          enum4 = 27;
          break;
        }
        case 'no-tty': {
          enum4 = 28;
          break;
        }
        case 'no-such-device': {
          enum4 = 29;
          break;
        }
        case 'overflow': {
          enum4 = 30;
          break;
        }
        case 'not-permitted': {
          enum4 = 31;
          break;
        }
        case 'pipe': {
          enum4 = 32;
          break;
        }
        case 'read-only': {
          enum4 = 33;
          break;
        }
        case 'invalid-seek': {
          enum4 = 34;
          break;
        }
        case 'text-file-busy': {
          enum4 = 35;
          break;
        }
        case 'cross-device': {
          enum4 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline86(arg0, arg1, arg2, arg3, arg4) {
  var handle1 = arg0;
  var rep2 = handleTable6[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable6.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Descriptor.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  if ((arg1 & 4294967294) !== 0) {
    throw new TypeError('flags have extraneous bits set');
  }
  var flags3 = {
    symlinkFollow: Boolean(arg1 & 1),
  };
  var ptr4 = arg2;
  var len4 = arg3;
  var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.metadataHashAt(flags3, result4)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant7 = ret;
  switch (variant7.tag) {
    case 'ok': {
      const e = variant7.val;
      dataView(memory0).setInt8(arg4 + 0, 0, true);
      var {lower: v5_0, upper: v5_1 } = e;
      dataView(memory0).setBigInt64(arg4 + 8, toUint64(v5_0), true);
      dataView(memory0).setBigInt64(arg4 + 16, toUint64(v5_1), true);
      break;
    }
    case 'err': {
      const e = variant7.val;
      dataView(memory0).setInt8(arg4 + 0, 1, true);
      var val6 = e;
      let enum6;
      switch (val6) {
        case 'access': {
          enum6 = 0;
          break;
        }
        case 'would-block': {
          enum6 = 1;
          break;
        }
        case 'already': {
          enum6 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum6 = 3;
          break;
        }
        case 'busy': {
          enum6 = 4;
          break;
        }
        case 'deadlock': {
          enum6 = 5;
          break;
        }
        case 'quota': {
          enum6 = 6;
          break;
        }
        case 'exist': {
          enum6 = 7;
          break;
        }
        case 'file-too-large': {
          enum6 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum6 = 9;
          break;
        }
        case 'in-progress': {
          enum6 = 10;
          break;
        }
        case 'interrupted': {
          enum6 = 11;
          break;
        }
        case 'invalid': {
          enum6 = 12;
          break;
        }
        case 'io': {
          enum6 = 13;
          break;
        }
        case 'is-directory': {
          enum6 = 14;
          break;
        }
        case 'loop': {
          enum6 = 15;
          break;
        }
        case 'too-many-links': {
          enum6 = 16;
          break;
        }
        case 'message-size': {
          enum6 = 17;
          break;
        }
        case 'name-too-long': {
          enum6 = 18;
          break;
        }
        case 'no-device': {
          enum6 = 19;
          break;
        }
        case 'no-entry': {
          enum6 = 20;
          break;
        }
        case 'no-lock': {
          enum6 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum6 = 22;
          break;
        }
        case 'insufficient-space': {
          enum6 = 23;
          break;
        }
        case 'not-directory': {
          enum6 = 24;
          break;
        }
        case 'not-empty': {
          enum6 = 25;
          break;
        }
        case 'not-recoverable': {
          enum6 = 26;
          break;
        }
        case 'unsupported': {
          enum6 = 27;
          break;
        }
        case 'no-tty': {
          enum6 = 28;
          break;
        }
        case 'no-such-device': {
          enum6 = 29;
          break;
        }
        case 'overflow': {
          enum6 = 30;
          break;
        }
        case 'not-permitted': {
          enum6 = 31;
          break;
        }
        case 'pipe': {
          enum6 = 32;
          break;
        }
        case 'read-only': {
          enum6 = 33;
          break;
        }
        case 'invalid-seek': {
          enum6 = 34;
          break;
        }
        case 'text-file-busy': {
          enum6 = 35;
          break;
        }
        case 'cross-device': {
          enum6 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val6}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg4 + 8, enum6, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline87(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable7[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable7.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(DirectoryEntryStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.readDirectoryEntry()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant6 = e;
      if (variant6 === null || variant6=== undefined) {
        dataView(memory0).setInt8(arg1 + 4, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(arg1 + 4, 1, true);
        var {type: v3_0, name: v3_1 } = e;
        var val4 = v3_0;
        let enum4;
        switch (val4) {
          case 'unknown': {
            enum4 = 0;
            break;
          }
          case 'block-device': {
            enum4 = 1;
            break;
          }
          case 'character-device': {
            enum4 = 2;
            break;
          }
          case 'directory': {
            enum4 = 3;
            break;
          }
          case 'fifo': {
            enum4 = 4;
            break;
          }
          case 'symbolic-link': {
            enum4 = 5;
            break;
          }
          case 'regular-file': {
            enum4 = 6;
            break;
          }
          case 'socket': {
            enum4 = 7;
            break;
          }
          default: {
            if ((v3_0) instanceof Error) {
              console.error(v3_0);
            }
            
            throw new TypeError(`"${val4}" is not one of the cases of descriptor-type`);
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
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'access': {
          enum7 = 0;
          break;
        }
        case 'would-block': {
          enum7 = 1;
          break;
        }
        case 'already': {
          enum7 = 2;
          break;
        }
        case 'bad-descriptor': {
          enum7 = 3;
          break;
        }
        case 'busy': {
          enum7 = 4;
          break;
        }
        case 'deadlock': {
          enum7 = 5;
          break;
        }
        case 'quota': {
          enum7 = 6;
          break;
        }
        case 'exist': {
          enum7 = 7;
          break;
        }
        case 'file-too-large': {
          enum7 = 8;
          break;
        }
        case 'illegal-byte-sequence': {
          enum7 = 9;
          break;
        }
        case 'in-progress': {
          enum7 = 10;
          break;
        }
        case 'interrupted': {
          enum7 = 11;
          break;
        }
        case 'invalid': {
          enum7 = 12;
          break;
        }
        case 'io': {
          enum7 = 13;
          break;
        }
        case 'is-directory': {
          enum7 = 14;
          break;
        }
        case 'loop': {
          enum7 = 15;
          break;
        }
        case 'too-many-links': {
          enum7 = 16;
          break;
        }
        case 'message-size': {
          enum7 = 17;
          break;
        }
        case 'name-too-long': {
          enum7 = 18;
          break;
        }
        case 'no-device': {
          enum7 = 19;
          break;
        }
        case 'no-entry': {
          enum7 = 20;
          break;
        }
        case 'no-lock': {
          enum7 = 21;
          break;
        }
        case 'insufficient-memory': {
          enum7 = 22;
          break;
        }
        case 'insufficient-space': {
          enum7 = 23;
          break;
        }
        case 'not-directory': {
          enum7 = 24;
          break;
        }
        case 'not-empty': {
          enum7 = 25;
          break;
        }
        case 'not-recoverable': {
          enum7 = 26;
          break;
        }
        case 'unsupported': {
          enum7 = 27;
          break;
        }
        case 'no-tty': {
          enum7 = 28;
          break;
        }
        case 'no-such-device': {
          enum7 = 29;
          break;
        }
        case 'overflow': {
          enum7 = 30;
          break;
        }
        case 'not-permitted': {
          enum7 = 31;
          break;
        }
        case 'pipe': {
          enum7 = 32;
          break;
        }
        case 'read-only': {
          enum7 = 33;
          break;
        }
        case 'invalid-seek': {
          enum7 = 34;
          break;
        }
        case 'text-file-busy': {
          enum7 = 35;
          break;
        }
        case 'cross-device': {
          enum7 = 36;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline88(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable0[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable0.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Error$1.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  const ret = filesystemErrorCode(rsc0);
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  if (variant4 === null || variant4=== undefined) {
    dataView(memory0).setInt8(arg1 + 0, 0, true);
  } else {
    const e = variant4;
    dataView(memory0).setInt8(arg1 + 0, 1, true);
    var val3 = e;
    let enum3;
    switch (val3) {
      case 'access': {
        enum3 = 0;
        break;
      }
      case 'would-block': {
        enum3 = 1;
        break;
      }
      case 'already': {
        enum3 = 2;
        break;
      }
      case 'bad-descriptor': {
        enum3 = 3;
        break;
      }
      case 'busy': {
        enum3 = 4;
        break;
      }
      case 'deadlock': {
        enum3 = 5;
        break;
      }
      case 'quota': {
        enum3 = 6;
        break;
      }
      case 'exist': {
        enum3 = 7;
        break;
      }
      case 'file-too-large': {
        enum3 = 8;
        break;
      }
      case 'illegal-byte-sequence': {
        enum3 = 9;
        break;
      }
      case 'in-progress': {
        enum3 = 10;
        break;
      }
      case 'interrupted': {
        enum3 = 11;
        break;
      }
      case 'invalid': {
        enum3 = 12;
        break;
      }
      case 'io': {
        enum3 = 13;
        break;
      }
      case 'is-directory': {
        enum3 = 14;
        break;
      }
      case 'loop': {
        enum3 = 15;
        break;
      }
      case 'too-many-links': {
        enum3 = 16;
        break;
      }
      case 'message-size': {
        enum3 = 17;
        break;
      }
      case 'name-too-long': {
        enum3 = 18;
        break;
      }
      case 'no-device': {
        enum3 = 19;
        break;
      }
      case 'no-entry': {
        enum3 = 20;
        break;
      }
      case 'no-lock': {
        enum3 = 21;
        break;
      }
      case 'insufficient-memory': {
        enum3 = 22;
        break;
      }
      case 'insufficient-space': {
        enum3 = 23;
        break;
      }
      case 'not-directory': {
        enum3 = 24;
        break;
      }
      case 'not-empty': {
        enum3 = 25;
        break;
      }
      case 'not-recoverable': {
        enum3 = 26;
        break;
      }
      case 'unsupported': {
        enum3 = 27;
        break;
      }
      case 'no-tty': {
        enum3 = 28;
        break;
      }
      case 'no-such-device': {
        enum3 = 29;
        break;
      }
      case 'overflow': {
        enum3 = 30;
        break;
      }
      case 'not-permitted': {
        enum3 = 31;
        break;
      }
      case 'pipe': {
        enum3 = 32;
        break;
      }
      case 'read-only': {
        enum3 = 33;
        break;
      }
      case 'invalid-seek': {
        enum3 = 34;
        break;
      }
      case 'text-file-busy': {
        enum3 = 35;
        break;
      }
      case 'cross-device': {
        enum3 = 36;
        break;
      }
      default: {
        if ((e) instanceof Error) {
          console.error(e);
        }
        
        throw new TypeError(`"${val3}" is not one of the cases of error-code`);
      }
    }
    dataView(memory0).setInt8(arg1 + 1, enum3, true);
  }
}

function trampoline89(arg0) {
  const ret = getDirectories();
  var vec3 = ret;
  var len3 = vec3.length;
  var result3 = realloc0(0, 0, 4, len3 * 12);
  for (let i = 0; i < vec3.length; i++) {
    const e = vec3[i];
    const base = result3 + i * 12;var [tuple0_0, tuple0_1] = e;
    if (!(tuple0_0 instanceof Descriptor)) {
      throw new TypeError('Resource error: Not a valid "Descriptor" resource.');
    }
    var handle1 = tuple0_0[symbolRscHandle];
    if (!handle1) {
      const rep = tuple0_0[symbolRscRep] || ++captureCnt6;
      captureTable6.set(rep, tuple0_0);
      handle1 = rscTableCreateOwn(handleTable6, rep);
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

function trampoline90(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable8[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable8.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(Network.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  let variant6;
  switch (arg2) {
    case 0: {
      variant6= {
        tag: 'ipv4',
        val: {
          port: clampGuest(arg3, 0, 65535),
          address: [clampGuest(arg4, 0, 255), clampGuest(arg5, 0, 255), clampGuest(arg6, 0, 255), clampGuest(arg7, 0, 255)],
        }
      };
      break;
    }
    case 1: {
      variant6= {
        tag: 'ipv6',
        val: {
          port: clampGuest(arg3, 0, 65535),
          flowInfo: arg4 >>> 0,
          address: [clampGuest(arg5, 0, 65535), clampGuest(arg6, 0, 65535), clampGuest(arg7, 0, 65535), clampGuest(arg8, 0, 65535), clampGuest(arg9, 0, 65535), clampGuest(arg10, 0, 65535), clampGuest(arg11, 0, 65535), clampGuest(arg12, 0, 65535)],
          scopeId: arg13 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for IpSocketAddress');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.startBind(rsc3, variant6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg14 + 1, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline91(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.finishBind()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline92(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let variant4;
  switch (arg1) {
    case 0: {
      variant4 = undefined;
      break;
    }
    case 1: {
      let variant3;
      switch (arg2) {
        case 0: {
          variant3= {
            tag: 'ipv4',
            val: {
              port: clampGuest(arg3, 0, 65535),
              address: [clampGuest(arg4, 0, 255), clampGuest(arg5, 0, 255), clampGuest(arg6, 0, 255), clampGuest(arg7, 0, 255)],
            }
          };
          break;
        }
        case 1: {
          variant3= {
            tag: 'ipv6',
            val: {
              port: clampGuest(arg3, 0, 65535),
              flowInfo: arg4 >>> 0,
              address: [clampGuest(arg5, 0, 65535), clampGuest(arg6, 0, 65535), clampGuest(arg7, 0, 65535), clampGuest(arg8, 0, 65535), clampGuest(arg9, 0, 65535), clampGuest(arg10, 0, 65535), clampGuest(arg11, 0, 65535), clampGuest(arg12, 0, 65535)],
              scopeId: arg13 >>> 0,
            }
          };
          break;
        }
        default: {
          throw new TypeError('invalid variant discriminant for IpSocketAddress');
        }
      }
      variant4 = variant3;
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for option');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.stream(variant4)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg14 + 0, 0, true);
      var [tuple5_0, tuple5_1] = e;
      if (!(tuple5_0 instanceof IncomingDatagramStream)) {
        throw new TypeError('Resource error: Not a valid "IncomingDatagramStream" resource.');
      }
      var handle6 = tuple5_0[symbolRscHandle];
      if (!handle6) {
        const rep = tuple5_0[symbolRscRep] || ++captureCnt10;
        captureTable10.set(rep, tuple5_0);
        handle6 = rscTableCreateOwn(handleTable10, rep);
      }
      dataView(memory0).setInt32(arg14 + 4, handle6, true);
      if (!(tuple5_1 instanceof OutgoingDatagramStream)) {
        throw new TypeError('Resource error: Not a valid "OutgoingDatagramStream" resource.');
      }
      var handle7 = tuple5_1[symbolRscHandle];
      if (!handle7) {
        const rep = tuple5_1[symbolRscRep] || ++captureCnt11;
        captureTable11.set(rep, tuple5_1);
        handle7 = rscTableCreateOwn(handleTable11, rep);
      }
      dataView(memory0).setInt32(arg14 + 8, handle7, true);
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg14 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'unknown': {
          enum8 = 0;
          break;
        }
        case 'access-denied': {
          enum8 = 1;
          break;
        }
        case 'not-supported': {
          enum8 = 2;
          break;
        }
        case 'invalid-argument': {
          enum8 = 3;
          break;
        }
        case 'out-of-memory': {
          enum8 = 4;
          break;
        }
        case 'timeout': {
          enum8 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum8 = 6;
          break;
        }
        case 'not-in-progress': {
          enum8 = 7;
          break;
        }
        case 'would-block': {
          enum8 = 8;
          break;
        }
        case 'invalid-state': {
          enum8 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum8 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum8 = 11;
          break;
        }
        case 'address-in-use': {
          enum8 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum8 = 13;
          break;
        }
        case 'connection-refused': {
          enum8 = 14;
          break;
        }
        case 'connection-reset': {
          enum8 = 15;
          break;
        }
        case 'connection-aborted': {
          enum8 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum8 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum8 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum8 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum8 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg14 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline93(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.localAddress()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'ipv4': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          var {port: v3_0, address: v3_1 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v3_0), true);
          var [tuple4_0, tuple4_1, tuple4_2, tuple4_3] = v3_1;
          dataView(memory0).setInt8(arg1 + 10, toUint8(tuple4_0), true);
          dataView(memory0).setInt8(arg1 + 11, toUint8(tuple4_1), true);
          dataView(memory0).setInt8(arg1 + 12, toUint8(tuple4_2), true);
          dataView(memory0).setInt8(arg1 + 13, toUint8(tuple4_3), true);
          break;
        }
        case 'ipv6': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          var {port: v5_0, flowInfo: v5_1, address: v5_2, scopeId: v5_3 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v5_0), true);
          dataView(memory0).setInt32(arg1 + 12, toUint32(v5_1), true);
          var [tuple6_0, tuple6_1, tuple6_2, tuple6_3, tuple6_4, tuple6_5, tuple6_6, tuple6_7] = v5_2;
          dataView(memory0).setInt16(arg1 + 16, toUint16(tuple6_0), true);
          dataView(memory0).setInt16(arg1 + 18, toUint16(tuple6_1), true);
          dataView(memory0).setInt16(arg1 + 20, toUint16(tuple6_2), true);
          dataView(memory0).setInt16(arg1 + 22, toUint16(tuple6_3), true);
          dataView(memory0).setInt16(arg1 + 24, toUint16(tuple6_4), true);
          dataView(memory0).setInt16(arg1 + 26, toUint16(tuple6_5), true);
          dataView(memory0).setInt16(arg1 + 28, toUint16(tuple6_6), true);
          dataView(memory0).setInt16(arg1 + 30, toUint16(tuple6_7), true);
          dataView(memory0).setInt32(arg1 + 32, toUint32(v5_3), true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`IpSocketAddress\``);
        }
      }
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'unknown': {
          enum8 = 0;
          break;
        }
        case 'access-denied': {
          enum8 = 1;
          break;
        }
        case 'not-supported': {
          enum8 = 2;
          break;
        }
        case 'invalid-argument': {
          enum8 = 3;
          break;
        }
        case 'out-of-memory': {
          enum8 = 4;
          break;
        }
        case 'timeout': {
          enum8 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum8 = 6;
          break;
        }
        case 'not-in-progress': {
          enum8 = 7;
          break;
        }
        case 'would-block': {
          enum8 = 8;
          break;
        }
        case 'invalid-state': {
          enum8 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum8 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum8 = 11;
          break;
        }
        case 'address-in-use': {
          enum8 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum8 = 13;
          break;
        }
        case 'connection-refused': {
          enum8 = 14;
          break;
        }
        case 'connection-reset': {
          enum8 = 15;
          break;
        }
        case 'connection-aborted': {
          enum8 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum8 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum8 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum8 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum8 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline94(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.remoteAddress()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'ipv4': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          var {port: v3_0, address: v3_1 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v3_0), true);
          var [tuple4_0, tuple4_1, tuple4_2, tuple4_3] = v3_1;
          dataView(memory0).setInt8(arg1 + 10, toUint8(tuple4_0), true);
          dataView(memory0).setInt8(arg1 + 11, toUint8(tuple4_1), true);
          dataView(memory0).setInt8(arg1 + 12, toUint8(tuple4_2), true);
          dataView(memory0).setInt8(arg1 + 13, toUint8(tuple4_3), true);
          break;
        }
        case 'ipv6': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          var {port: v5_0, flowInfo: v5_1, address: v5_2, scopeId: v5_3 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v5_0), true);
          dataView(memory0).setInt32(arg1 + 12, toUint32(v5_1), true);
          var [tuple6_0, tuple6_1, tuple6_2, tuple6_3, tuple6_4, tuple6_5, tuple6_6, tuple6_7] = v5_2;
          dataView(memory0).setInt16(arg1 + 16, toUint16(tuple6_0), true);
          dataView(memory0).setInt16(arg1 + 18, toUint16(tuple6_1), true);
          dataView(memory0).setInt16(arg1 + 20, toUint16(tuple6_2), true);
          dataView(memory0).setInt16(arg1 + 22, toUint16(tuple6_3), true);
          dataView(memory0).setInt16(arg1 + 24, toUint16(tuple6_4), true);
          dataView(memory0).setInt16(arg1 + 26, toUint16(tuple6_5), true);
          dataView(memory0).setInt16(arg1 + 28, toUint16(tuple6_6), true);
          dataView(memory0).setInt16(arg1 + 30, toUint16(tuple6_7), true);
          dataView(memory0).setInt32(arg1 + 32, toUint32(v5_3), true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`IpSocketAddress\``);
        }
      }
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'unknown': {
          enum8 = 0;
          break;
        }
        case 'access-denied': {
          enum8 = 1;
          break;
        }
        case 'not-supported': {
          enum8 = 2;
          break;
        }
        case 'invalid-argument': {
          enum8 = 3;
          break;
        }
        case 'out-of-memory': {
          enum8 = 4;
          break;
        }
        case 'timeout': {
          enum8 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum8 = 6;
          break;
        }
        case 'not-in-progress': {
          enum8 = 7;
          break;
        }
        case 'would-block': {
          enum8 = 8;
          break;
        }
        case 'invalid-state': {
          enum8 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum8 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum8 = 11;
          break;
        }
        case 'address-in-use': {
          enum8 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum8 = 13;
          break;
        }
        case 'connection-refused': {
          enum8 = 14;
          break;
        }
        case 'connection-reset': {
          enum8 = 15;
          break;
        }
        case 'connection-aborted': {
          enum8 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum8 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum8 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum8 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum8 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline95(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.unicastHopLimit()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setInt8(arg1 + 1, toUint8(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline96(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setUnicastHopLimit(clampGuest(arg1, 0, 255))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline97(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.receiveBufferSize()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline98(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setReceiveBufferSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline99(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.sendBufferSize()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline100(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable9[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable9.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(UdpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setSendBufferSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline101(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable10[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable10.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(IncomingDatagramStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.receive(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant12 = ret;
  switch (variant12.tag) {
    case 'ok': {
      const e = variant12.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      var vec10 = e;
      var len10 = vec10.length;
      var result10 = realloc0(0, 0, 4, len10 * 40);
      for (let i = 0; i < vec10.length; i++) {
        const e = vec10[i];
        const base = result10 + i * 40;var {data: v3_0, remoteAddress: v3_1 } = e;
        var val4 = v3_0;
        var len4 = val4.byteLength;
        var ptr4 = realloc0(0, 0, 1, len4 * 1);
        var src4 = new Uint8Array(val4.buffer || val4, val4.byteOffset, len4 * 1);
        (new Uint8Array(memory0.buffer, ptr4, len4 * 1)).set(src4);
        dataView(memory0).setInt32(base + 4, len4, true);
        dataView(memory0).setInt32(base + 0, ptr4, true);
        var variant9 = v3_1;
        switch (variant9.tag) {
          case 'ipv4': {
            const e = variant9.val;
            dataView(memory0).setInt8(base + 8, 0, true);
            var {port: v5_0, address: v5_1 } = e;
            dataView(memory0).setInt16(base + 12, toUint16(v5_0), true);
            var [tuple6_0, tuple6_1, tuple6_2, tuple6_3] = v5_1;
            dataView(memory0).setInt8(base + 14, toUint8(tuple6_0), true);
            dataView(memory0).setInt8(base + 15, toUint8(tuple6_1), true);
            dataView(memory0).setInt8(base + 16, toUint8(tuple6_2), true);
            dataView(memory0).setInt8(base + 17, toUint8(tuple6_3), true);
            break;
          }
          case 'ipv6': {
            const e = variant9.val;
            dataView(memory0).setInt8(base + 8, 1, true);
            var {port: v7_0, flowInfo: v7_1, address: v7_2, scopeId: v7_3 } = e;
            dataView(memory0).setInt16(base + 12, toUint16(v7_0), true);
            dataView(memory0).setInt32(base + 16, toUint32(v7_1), true);
            var [tuple8_0, tuple8_1, tuple8_2, tuple8_3, tuple8_4, tuple8_5, tuple8_6, tuple8_7] = v7_2;
            dataView(memory0).setInt16(base + 20, toUint16(tuple8_0), true);
            dataView(memory0).setInt16(base + 22, toUint16(tuple8_1), true);
            dataView(memory0).setInt16(base + 24, toUint16(tuple8_2), true);
            dataView(memory0).setInt16(base + 26, toUint16(tuple8_3), true);
            dataView(memory0).setInt16(base + 28, toUint16(tuple8_4), true);
            dataView(memory0).setInt16(base + 30, toUint16(tuple8_5), true);
            dataView(memory0).setInt16(base + 32, toUint16(tuple8_6), true);
            dataView(memory0).setInt16(base + 34, toUint16(tuple8_7), true);
            dataView(memory0).setInt32(base + 36, toUint32(v7_3), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant9.tag)}\` (received \`${variant9}\`) specified for \`IpSocketAddress\``);
          }
        }
      }
      dataView(memory0).setInt32(arg2 + 8, len10, true);
      dataView(memory0).setInt32(arg2 + 4, result10, true);
      break;
    }
    case 'err': {
      const e = variant12.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val11 = e;
      let enum11;
      switch (val11) {
        case 'unknown': {
          enum11 = 0;
          break;
        }
        case 'access-denied': {
          enum11 = 1;
          break;
        }
        case 'not-supported': {
          enum11 = 2;
          break;
        }
        case 'invalid-argument': {
          enum11 = 3;
          break;
        }
        case 'out-of-memory': {
          enum11 = 4;
          break;
        }
        case 'timeout': {
          enum11 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum11 = 6;
          break;
        }
        case 'not-in-progress': {
          enum11 = 7;
          break;
        }
        case 'would-block': {
          enum11 = 8;
          break;
        }
        case 'invalid-state': {
          enum11 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum11 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum11 = 11;
          break;
        }
        case 'address-in-use': {
          enum11 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum11 = 13;
          break;
        }
        case 'connection-refused': {
          enum11 = 14;
          break;
        }
        case 'connection-reset': {
          enum11 = 15;
          break;
        }
        case 'connection-aborted': {
          enum11 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum11 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum11 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum11 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum11 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val11}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 4, enum11, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline102(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable11[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable11.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutgoingDatagramStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.checkSend()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline103(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable11[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable11.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(OutgoingDatagramStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var len6 = arg2;
  var base6 = arg1;
  var result6 = [];
  for (let i = 0; i < len6; i++) {
    const base = base6 + i * 44;
    var ptr3 = dataView(memory0).getInt32(base + 0, true);
    var len3 = dataView(memory0).getInt32(base + 4, true);
    var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
    let variant5;
    switch (dataView(memory0).getUint8(base + 8, true)) {
      case 0: {
        variant5 = undefined;
        break;
      }
      case 1: {
        let variant4;
        switch (dataView(memory0).getUint8(base + 12, true)) {
          case 0: {
            variant4= {
              tag: 'ipv4',
              val: {
                port: clampGuest(dataView(memory0).getUint16(base + 16, true), 0, 65535),
                address: [clampGuest(dataView(memory0).getUint8(base + 18, true), 0, 255), clampGuest(dataView(memory0).getUint8(base + 19, true), 0, 255), clampGuest(dataView(memory0).getUint8(base + 20, true), 0, 255), clampGuest(dataView(memory0).getUint8(base + 21, true), 0, 255)],
              }
            };
            break;
          }
          case 1: {
            variant4= {
              tag: 'ipv6',
              val: {
                port: clampGuest(dataView(memory0).getUint16(base + 16, true), 0, 65535),
                flowInfo: dataView(memory0).getInt32(base + 20, true) >>> 0,
                address: [clampGuest(dataView(memory0).getUint16(base + 24, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 26, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 28, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 30, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 32, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 34, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 36, true), 0, 65535), clampGuest(dataView(memory0).getUint16(base + 38, true), 0, 65535)],
                scopeId: dataView(memory0).getInt32(base + 40, true) >>> 0,
              }
            };
            break;
          }
          default: {
            throw new TypeError('invalid variant discriminant for IpSocketAddress');
          }
        }
        variant5 = variant4;
        break;
      }
      default: {
        throw new TypeError('invalid variant discriminant for option');
      }
    }
    result6.push({
      data: result3,
      remoteAddress: variant5,
    });
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.send(result6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      dataView(memory0).setBigInt64(arg3 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 8, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline104(arg0, arg1) {
  let enum0;
  switch (arg0) {
    case 0: {
      enum0 = 'ipv4';
      break;
    }
    case 1: {
      enum0 = 'ipv6';
      break;
    }
    default: {
      throw new TypeError('invalid discriminant specified for IpAddressFamily');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: createUdpSocket(enum0)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  var variant3 = ret;
  switch (variant3.tag) {
    case 'ok': {
      const e = variant3.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof UdpSocket)) {
        throw new TypeError('Resource error: Not a valid "UdpSocket" resource.');
      }
      var handle1 = e[symbolRscHandle];
      if (!handle1) {
        const rep = e[symbolRscRep] || ++captureCnt9;
        captureTable9.set(rep, e);
        handle1 = rscTableCreateOwn(handleTable9, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle1, true);
      break;
    }
    case 'err': {
      const e = variant3.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val2 = e;
      let enum2;
      switch (val2) {
        case 'unknown': {
          enum2 = 0;
          break;
        }
        case 'access-denied': {
          enum2 = 1;
          break;
        }
        case 'not-supported': {
          enum2 = 2;
          break;
        }
        case 'invalid-argument': {
          enum2 = 3;
          break;
        }
        case 'out-of-memory': {
          enum2 = 4;
          break;
        }
        case 'timeout': {
          enum2 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum2 = 6;
          break;
        }
        case 'not-in-progress': {
          enum2 = 7;
          break;
        }
        case 'would-block': {
          enum2 = 8;
          break;
        }
        case 'invalid-state': {
          enum2 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum2 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum2 = 11;
          break;
        }
        case 'address-in-use': {
          enum2 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum2 = 13;
          break;
        }
        case 'connection-refused': {
          enum2 = 14;
          break;
        }
        case 'connection-reset': {
          enum2 = 15;
          break;
        }
        case 'connection-aborted': {
          enum2 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum2 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum2 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum2 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum2 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val2}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum2, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline105(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable8[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable8.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(Network.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  let variant6;
  switch (arg2) {
    case 0: {
      variant6= {
        tag: 'ipv4',
        val: {
          port: clampGuest(arg3, 0, 65535),
          address: [clampGuest(arg4, 0, 255), clampGuest(arg5, 0, 255), clampGuest(arg6, 0, 255), clampGuest(arg7, 0, 255)],
        }
      };
      break;
    }
    case 1: {
      variant6= {
        tag: 'ipv6',
        val: {
          port: clampGuest(arg3, 0, 65535),
          flowInfo: arg4 >>> 0,
          address: [clampGuest(arg5, 0, 65535), clampGuest(arg6, 0, 65535), clampGuest(arg7, 0, 65535), clampGuest(arg8, 0, 65535), clampGuest(arg9, 0, 65535), clampGuest(arg10, 0, 65535), clampGuest(arg11, 0, 65535), clampGuest(arg12, 0, 65535)],
          scopeId: arg13 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for IpSocketAddress');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.startBind(rsc3, variant6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg14 + 1, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline106(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.finishBind()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline107(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var handle4 = arg1;
  var rep5 = handleTable8[(handle4 << 1) + 1] & ~T_FLAG;
  var rsc3 = captureTable8.get(rep5);
  if (!rsc3) {
    rsc3 = Object.create(Network.prototype);
    Object.defineProperty(rsc3, symbolRscHandle, { writable: true, value: handle4});
    Object.defineProperty(rsc3, symbolRscRep, { writable: true, value: rep5});
  }
  curResourceBorrows.push(rsc3);
  let variant6;
  switch (arg2) {
    case 0: {
      variant6= {
        tag: 'ipv4',
        val: {
          port: clampGuest(arg3, 0, 65535),
          address: [clampGuest(arg4, 0, 255), clampGuest(arg5, 0, 255), clampGuest(arg6, 0, 255), clampGuest(arg7, 0, 255)],
        }
      };
      break;
    }
    case 1: {
      variant6= {
        tag: 'ipv6',
        val: {
          port: clampGuest(arg3, 0, 65535),
          flowInfo: arg4 >>> 0,
          address: [clampGuest(arg5, 0, 65535), clampGuest(arg6, 0, 65535), clampGuest(arg7, 0, 65535), clampGuest(arg8, 0, 65535), clampGuest(arg9, 0, 65535), clampGuest(arg10, 0, 65535), clampGuest(arg11, 0, 65535), clampGuest(arg12, 0, 65535)],
          scopeId: arg13 >>> 0,
        }
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for IpSocketAddress');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.startConnect(rsc3, variant6)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg14 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg14 + 1, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline108(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.finishConnect()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant7 = ret;
  switch (variant7.tag) {
    case 'ok': {
      const e = variant7.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var [tuple3_0, tuple3_1] = e;
      if (!(tuple3_0 instanceof InputStream)) {
        throw new TypeError('Resource error: Not a valid "InputStream" resource.');
      }
      var handle4 = tuple3_0[symbolRscHandle];
      if (!handle4) {
        const rep = tuple3_0[symbolRscRep] || ++captureCnt2;
        captureTable2.set(rep, tuple3_0);
        handle4 = rscTableCreateOwn(handleTable2, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle4, true);
      if (!(tuple3_1 instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
      }
      var handle5 = tuple3_1[symbolRscHandle];
      if (!handle5) {
        const rep = tuple3_1[symbolRscRep] || ++captureCnt3;
        captureTable3.set(rep, tuple3_1);
        handle5 = rscTableCreateOwn(handleTable3, rep);
      }
      dataView(memory0).setInt32(arg1 + 8, handle5, true);
      break;
    }
    case 'err': {
      const e = variant7.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val6 = e;
      let enum6;
      switch (val6) {
        case 'unknown': {
          enum6 = 0;
          break;
        }
        case 'access-denied': {
          enum6 = 1;
          break;
        }
        case 'not-supported': {
          enum6 = 2;
          break;
        }
        case 'invalid-argument': {
          enum6 = 3;
          break;
        }
        case 'out-of-memory': {
          enum6 = 4;
          break;
        }
        case 'timeout': {
          enum6 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum6 = 6;
          break;
        }
        case 'not-in-progress': {
          enum6 = 7;
          break;
        }
        case 'would-block': {
          enum6 = 8;
          break;
        }
        case 'invalid-state': {
          enum6 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum6 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum6 = 11;
          break;
        }
        case 'address-in-use': {
          enum6 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum6 = 13;
          break;
        }
        case 'connection-refused': {
          enum6 = 14;
          break;
        }
        case 'connection-reset': {
          enum6 = 15;
          break;
        }
        case 'connection-aborted': {
          enum6 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum6 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum6 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum6 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum6 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val6}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum6, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline109(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.startListen()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline110(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.finishListen()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline111(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.accept()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var [tuple3_0, tuple3_1, tuple3_2] = e;
      if (!(tuple3_0 instanceof TcpSocket)) {
        throw new TypeError('Resource error: Not a valid "TcpSocket" resource.');
      }
      var handle4 = tuple3_0[symbolRscHandle];
      if (!handle4) {
        const rep = tuple3_0[symbolRscRep] || ++captureCnt12;
        captureTable12.set(rep, tuple3_0);
        handle4 = rscTableCreateOwn(handleTable12, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle4, true);
      if (!(tuple3_1 instanceof InputStream)) {
        throw new TypeError('Resource error: Not a valid "InputStream" resource.');
      }
      var handle5 = tuple3_1[symbolRscHandle];
      if (!handle5) {
        const rep = tuple3_1[symbolRscRep] || ++captureCnt2;
        captureTable2.set(rep, tuple3_1);
        handle5 = rscTableCreateOwn(handleTable2, rep);
      }
      dataView(memory0).setInt32(arg1 + 8, handle5, true);
      if (!(tuple3_2 instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
      }
      var handle6 = tuple3_2[symbolRscHandle];
      if (!handle6) {
        const rep = tuple3_2[symbolRscRep] || ++captureCnt3;
        captureTable3.set(rep, tuple3_2);
        handle6 = rscTableCreateOwn(handleTable3, rep);
      }
      dataView(memory0).setInt32(arg1 + 12, handle6, true);
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline112(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.localAddress()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'ipv4': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          var {port: v3_0, address: v3_1 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v3_0), true);
          var [tuple4_0, tuple4_1, tuple4_2, tuple4_3] = v3_1;
          dataView(memory0).setInt8(arg1 + 10, toUint8(tuple4_0), true);
          dataView(memory0).setInt8(arg1 + 11, toUint8(tuple4_1), true);
          dataView(memory0).setInt8(arg1 + 12, toUint8(tuple4_2), true);
          dataView(memory0).setInt8(arg1 + 13, toUint8(tuple4_3), true);
          break;
        }
        case 'ipv6': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          var {port: v5_0, flowInfo: v5_1, address: v5_2, scopeId: v5_3 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v5_0), true);
          dataView(memory0).setInt32(arg1 + 12, toUint32(v5_1), true);
          var [tuple6_0, tuple6_1, tuple6_2, tuple6_3, tuple6_4, tuple6_5, tuple6_6, tuple6_7] = v5_2;
          dataView(memory0).setInt16(arg1 + 16, toUint16(tuple6_0), true);
          dataView(memory0).setInt16(arg1 + 18, toUint16(tuple6_1), true);
          dataView(memory0).setInt16(arg1 + 20, toUint16(tuple6_2), true);
          dataView(memory0).setInt16(arg1 + 22, toUint16(tuple6_3), true);
          dataView(memory0).setInt16(arg1 + 24, toUint16(tuple6_4), true);
          dataView(memory0).setInt16(arg1 + 26, toUint16(tuple6_5), true);
          dataView(memory0).setInt16(arg1 + 28, toUint16(tuple6_6), true);
          dataView(memory0).setInt16(arg1 + 30, toUint16(tuple6_7), true);
          dataView(memory0).setInt32(arg1 + 32, toUint32(v5_3), true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`IpSocketAddress\``);
        }
      }
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'unknown': {
          enum8 = 0;
          break;
        }
        case 'access-denied': {
          enum8 = 1;
          break;
        }
        case 'not-supported': {
          enum8 = 2;
          break;
        }
        case 'invalid-argument': {
          enum8 = 3;
          break;
        }
        case 'out-of-memory': {
          enum8 = 4;
          break;
        }
        case 'timeout': {
          enum8 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum8 = 6;
          break;
        }
        case 'not-in-progress': {
          enum8 = 7;
          break;
        }
        case 'would-block': {
          enum8 = 8;
          break;
        }
        case 'invalid-state': {
          enum8 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum8 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum8 = 11;
          break;
        }
        case 'address-in-use': {
          enum8 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum8 = 13;
          break;
        }
        case 'connection-refused': {
          enum8 = 14;
          break;
        }
        case 'connection-reset': {
          enum8 = 15;
          break;
        }
        case 'connection-aborted': {
          enum8 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum8 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum8 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum8 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum8 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline113(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.remoteAddress()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant9 = ret;
  switch (variant9.tag) {
    case 'ok': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant7 = e;
      switch (variant7.tag) {
        case 'ipv4': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 0, true);
          var {port: v3_0, address: v3_1 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v3_0), true);
          var [tuple4_0, tuple4_1, tuple4_2, tuple4_3] = v3_1;
          dataView(memory0).setInt8(arg1 + 10, toUint8(tuple4_0), true);
          dataView(memory0).setInt8(arg1 + 11, toUint8(tuple4_1), true);
          dataView(memory0).setInt8(arg1 + 12, toUint8(tuple4_2), true);
          dataView(memory0).setInt8(arg1 + 13, toUint8(tuple4_3), true);
          break;
        }
        case 'ipv6': {
          const e = variant7.val;
          dataView(memory0).setInt8(arg1 + 4, 1, true);
          var {port: v5_0, flowInfo: v5_1, address: v5_2, scopeId: v5_3 } = e;
          dataView(memory0).setInt16(arg1 + 8, toUint16(v5_0), true);
          dataView(memory0).setInt32(arg1 + 12, toUint32(v5_1), true);
          var [tuple6_0, tuple6_1, tuple6_2, tuple6_3, tuple6_4, tuple6_5, tuple6_6, tuple6_7] = v5_2;
          dataView(memory0).setInt16(arg1 + 16, toUint16(tuple6_0), true);
          dataView(memory0).setInt16(arg1 + 18, toUint16(tuple6_1), true);
          dataView(memory0).setInt16(arg1 + 20, toUint16(tuple6_2), true);
          dataView(memory0).setInt16(arg1 + 22, toUint16(tuple6_3), true);
          dataView(memory0).setInt16(arg1 + 24, toUint16(tuple6_4), true);
          dataView(memory0).setInt16(arg1 + 26, toUint16(tuple6_5), true);
          dataView(memory0).setInt16(arg1 + 28, toUint16(tuple6_6), true);
          dataView(memory0).setInt16(arg1 + 30, toUint16(tuple6_7), true);
          dataView(memory0).setInt32(arg1 + 32, toUint32(v5_3), true);
          break;
        }
        default: {
          throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant7.tag)}\` (received \`${variant7}\`) specified for \`IpSocketAddress\``);
        }
      }
      break;
    }
    case 'err': {
      const e = variant9.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val8 = e;
      let enum8;
      switch (val8) {
        case 'unknown': {
          enum8 = 0;
          break;
        }
        case 'access-denied': {
          enum8 = 1;
          break;
        }
        case 'not-supported': {
          enum8 = 2;
          break;
        }
        case 'invalid-argument': {
          enum8 = 3;
          break;
        }
        case 'out-of-memory': {
          enum8 = 4;
          break;
        }
        case 'timeout': {
          enum8 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum8 = 6;
          break;
        }
        case 'not-in-progress': {
          enum8 = 7;
          break;
        }
        case 'would-block': {
          enum8 = 8;
          break;
        }
        case 'invalid-state': {
          enum8 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum8 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum8 = 11;
          break;
        }
        case 'address-in-use': {
          enum8 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum8 = 13;
          break;
        }
        case 'connection-refused': {
          enum8 = 14;
          break;
        }
        case 'connection-reset': {
          enum8 = 15;
          break;
        }
        case 'connection-aborted': {
          enum8 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum8 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum8 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum8 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum8 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val8}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum8, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline114(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setListenBacklogSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline115(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.keepAliveEnabled()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setInt8(arg1 + 1, e ? 1 : 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline116(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var bool3 = arg1;
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setKeepAliveEnabled(bool3 == 0 ? false : (bool3 == 1 ? true : throwInvalidBool()))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'unknown': {
          enum4 = 0;
          break;
        }
        case 'access-denied': {
          enum4 = 1;
          break;
        }
        case 'not-supported': {
          enum4 = 2;
          break;
        }
        case 'invalid-argument': {
          enum4 = 3;
          break;
        }
        case 'out-of-memory': {
          enum4 = 4;
          break;
        }
        case 'timeout': {
          enum4 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum4 = 6;
          break;
        }
        case 'not-in-progress': {
          enum4 = 7;
          break;
        }
        case 'would-block': {
          enum4 = 8;
          break;
        }
        case 'invalid-state': {
          enum4 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum4 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum4 = 11;
          break;
        }
        case 'address-in-use': {
          enum4 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum4 = 13;
          break;
        }
        case 'connection-refused': {
          enum4 = 14;
          break;
        }
        case 'connection-reset': {
          enum4 = 15;
          break;
        }
        case 'connection-aborted': {
          enum4 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum4 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum4 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum4 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum4 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline117(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.keepAliveIdleTime()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline118(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setKeepAliveIdleTime(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline119(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.keepAliveInterval()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline120(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setKeepAliveInterval(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline121(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.keepAliveCount()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setInt32(arg1 + 4, toUint32(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline122(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setKeepAliveCount(arg1 >>> 0)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline123(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.hopLimit()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setInt8(arg1 + 1, toUint8(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline124(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setHopLimit(clampGuest(arg1, 0, 255))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline125(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.receiveBufferSize()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline126(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setReceiveBufferSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline127(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.sendBufferSize()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      dataView(memory0).setBigInt64(arg1 + 8, toUint64(e), true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 8, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline128(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.setSendBufferSize(BigInt.asUintN(64, arg1))};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant4 = ret;
  switch (variant4.tag) {
    case 'ok': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant4.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val3 = e;
      let enum3;
      switch (val3) {
        case 'unknown': {
          enum3 = 0;
          break;
        }
        case 'access-denied': {
          enum3 = 1;
          break;
        }
        case 'not-supported': {
          enum3 = 2;
          break;
        }
        case 'invalid-argument': {
          enum3 = 3;
          break;
        }
        case 'out-of-memory': {
          enum3 = 4;
          break;
        }
        case 'timeout': {
          enum3 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum3 = 6;
          break;
        }
        case 'not-in-progress': {
          enum3 = 7;
          break;
        }
        case 'would-block': {
          enum3 = 8;
          break;
        }
        case 'invalid-state': {
          enum3 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum3 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum3 = 11;
          break;
        }
        case 'address-in-use': {
          enum3 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum3 = 13;
          break;
        }
        case 'connection-refused': {
          enum3 = 14;
          break;
        }
        case 'connection-reset': {
          enum3 = 15;
          break;
        }
        case 'connection-aborted': {
          enum3 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum3 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum3 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum3 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum3 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val3}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum3, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline129(arg0, arg1, arg2) {
  var handle1 = arg0;
  var rep2 = handleTable12[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable12.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(TcpSocket.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let enum3;
  switch (arg1) {
    case 0: {
      enum3 = 'receive';
      break;
    }
    case 1: {
      enum3 = 'send';
      break;
    }
    case 2: {
      enum3 = 'both';
      break;
    }
    default: {
      throw new TypeError('invalid discriminant specified for ShutdownType');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.shutdown(enum3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant5 = ret;
  switch (variant5.tag) {
    case 'ok': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 0, true);
      break;
    }
    case 'err': {
      const e = variant5.val;
      dataView(memory0).setInt8(arg2 + 0, 1, true);
      var val4 = e;
      let enum4;
      switch (val4) {
        case 'unknown': {
          enum4 = 0;
          break;
        }
        case 'access-denied': {
          enum4 = 1;
          break;
        }
        case 'not-supported': {
          enum4 = 2;
          break;
        }
        case 'invalid-argument': {
          enum4 = 3;
          break;
        }
        case 'out-of-memory': {
          enum4 = 4;
          break;
        }
        case 'timeout': {
          enum4 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum4 = 6;
          break;
        }
        case 'not-in-progress': {
          enum4 = 7;
          break;
        }
        case 'would-block': {
          enum4 = 8;
          break;
        }
        case 'invalid-state': {
          enum4 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum4 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum4 = 11;
          break;
        }
        case 'address-in-use': {
          enum4 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum4 = 13;
          break;
        }
        case 'connection-refused': {
          enum4 = 14;
          break;
        }
        case 'connection-reset': {
          enum4 = 15;
          break;
        }
        case 'connection-aborted': {
          enum4 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum4 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum4 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum4 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum4 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val4}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg2 + 1, enum4, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline130(arg0, arg1) {
  let enum0;
  switch (arg0) {
    case 0: {
      enum0 = 'ipv4';
      break;
    }
    case 1: {
      enum0 = 'ipv6';
      break;
    }
    default: {
      throw new TypeError('invalid discriminant specified for IpAddressFamily');
    }
  }
  let ret;
  try {
    ret = { tag: 'ok', val: createTcpSocket(enum0)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  var variant3 = ret;
  switch (variant3.tag) {
    case 'ok': {
      const e = variant3.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      if (!(e instanceof TcpSocket)) {
        throw new TypeError('Resource error: Not a valid "TcpSocket" resource.');
      }
      var handle1 = e[symbolRscHandle];
      if (!handle1) {
        const rep = e[symbolRscRep] || ++captureCnt12;
        captureTable12.set(rep, e);
        handle1 = rscTableCreateOwn(handleTable12, rep);
      }
      dataView(memory0).setInt32(arg1 + 4, handle1, true);
      break;
    }
    case 'err': {
      const e = variant3.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val2 = e;
      let enum2;
      switch (val2) {
        case 'unknown': {
          enum2 = 0;
          break;
        }
        case 'access-denied': {
          enum2 = 1;
          break;
        }
        case 'not-supported': {
          enum2 = 2;
          break;
        }
        case 'invalid-argument': {
          enum2 = 3;
          break;
        }
        case 'out-of-memory': {
          enum2 = 4;
          break;
        }
        case 'timeout': {
          enum2 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum2 = 6;
          break;
        }
        case 'not-in-progress': {
          enum2 = 7;
          break;
        }
        case 'would-block': {
          enum2 = 8;
          break;
        }
        case 'invalid-state': {
          enum2 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum2 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum2 = 11;
          break;
        }
        case 'address-in-use': {
          enum2 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum2 = 13;
          break;
        }
        case 'connection-refused': {
          enum2 = 14;
          break;
        }
        case 'connection-reset': {
          enum2 = 15;
          break;
        }
        case 'connection-aborted': {
          enum2 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum2 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum2 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum2 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum2 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val2}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 4, enum2, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline131(arg0, arg1) {
  var handle1 = arg0;
  var rep2 = handleTable13[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable13.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(ResolveAddressStream.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  let ret;
  try {
    ret = { tag: 'ok', val: rsc0.resolveNextAddress()};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant8 = ret;
  switch (variant8.tag) {
    case 'ok': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 0, true);
      var variant6 = e;
      if (variant6 === null || variant6=== undefined) {
        dataView(memory0).setInt8(arg1 + 2, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(arg1 + 2, 1, true);
        var variant5 = e;
        switch (variant5.tag) {
          case 'ipv4': {
            const e = variant5.val;
            dataView(memory0).setInt8(arg1 + 4, 0, true);
            var [tuple3_0, tuple3_1, tuple3_2, tuple3_3] = e;
            dataView(memory0).setInt8(arg1 + 6, toUint8(tuple3_0), true);
            dataView(memory0).setInt8(arg1 + 7, toUint8(tuple3_1), true);
            dataView(memory0).setInt8(arg1 + 8, toUint8(tuple3_2), true);
            dataView(memory0).setInt8(arg1 + 9, toUint8(tuple3_3), true);
            break;
          }
          case 'ipv6': {
            const e = variant5.val;
            dataView(memory0).setInt8(arg1 + 4, 1, true);
            var [tuple4_0, tuple4_1, tuple4_2, tuple4_3, tuple4_4, tuple4_5, tuple4_6, tuple4_7] = e;
            dataView(memory0).setInt16(arg1 + 6, toUint16(tuple4_0), true);
            dataView(memory0).setInt16(arg1 + 8, toUint16(tuple4_1), true);
            dataView(memory0).setInt16(arg1 + 10, toUint16(tuple4_2), true);
            dataView(memory0).setInt16(arg1 + 12, toUint16(tuple4_3), true);
            dataView(memory0).setInt16(arg1 + 14, toUint16(tuple4_4), true);
            dataView(memory0).setInt16(arg1 + 16, toUint16(tuple4_5), true);
            dataView(memory0).setInt16(arg1 + 18, toUint16(tuple4_6), true);
            dataView(memory0).setInt16(arg1 + 20, toUint16(tuple4_7), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`IpAddress\``);
          }
        }
      }
      break;
    }
    case 'err': {
      const e = variant8.val;
      dataView(memory0).setInt8(arg1 + 0, 1, true);
      var val7 = e;
      let enum7;
      switch (val7) {
        case 'unknown': {
          enum7 = 0;
          break;
        }
        case 'access-denied': {
          enum7 = 1;
          break;
        }
        case 'not-supported': {
          enum7 = 2;
          break;
        }
        case 'invalid-argument': {
          enum7 = 3;
          break;
        }
        case 'out-of-memory': {
          enum7 = 4;
          break;
        }
        case 'timeout': {
          enum7 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum7 = 6;
          break;
        }
        case 'not-in-progress': {
          enum7 = 7;
          break;
        }
        case 'would-block': {
          enum7 = 8;
          break;
        }
        case 'invalid-state': {
          enum7 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum7 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum7 = 11;
          break;
        }
        case 'address-in-use': {
          enum7 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum7 = 13;
          break;
        }
        case 'connection-refused': {
          enum7 = 14;
          break;
        }
        case 'connection-reset': {
          enum7 = 15;
          break;
        }
        case 'connection-aborted': {
          enum7 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum7 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum7 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum7 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum7 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val7}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg1 + 2, enum7, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline132(arg0, arg1, arg2, arg3) {
  var handle1 = arg0;
  var rep2 = handleTable8[(handle1 << 1) + 1] & ~T_FLAG;
  var rsc0 = captureTable8.get(rep2);
  if (!rsc0) {
    rsc0 = Object.create(Network.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
  }
  curResourceBorrows.push(rsc0);
  var ptr3 = arg1;
  var len3 = arg2;
  var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
  let ret;
  try {
    ret = { tag: 'ok', val: resolveAddresses(rsc0, result3)};
  } catch (e) {
    ret = { tag: 'err', val: getErrorPayload(e) };
  }
  for (const rsc of curResourceBorrows) {
    rsc[symbolRscHandle] = undefined;
  }
  curResourceBorrows = [];
  var variant6 = ret;
  switch (variant6.tag) {
    case 'ok': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 0, true);
      if (!(e instanceof ResolveAddressStream)) {
        throw new TypeError('Resource error: Not a valid "ResolveAddressStream" resource.');
      }
      var handle4 = e[symbolRscHandle];
      if (!handle4) {
        const rep = e[symbolRscRep] || ++captureCnt13;
        captureTable13.set(rep, e);
        handle4 = rscTableCreateOwn(handleTable13, rep);
      }
      dataView(memory0).setInt32(arg3 + 4, handle4, true);
      break;
    }
    case 'err': {
      const e = variant6.val;
      dataView(memory0).setInt8(arg3 + 0, 1, true);
      var val5 = e;
      let enum5;
      switch (val5) {
        case 'unknown': {
          enum5 = 0;
          break;
        }
        case 'access-denied': {
          enum5 = 1;
          break;
        }
        case 'not-supported': {
          enum5 = 2;
          break;
        }
        case 'invalid-argument': {
          enum5 = 3;
          break;
        }
        case 'out-of-memory': {
          enum5 = 4;
          break;
        }
        case 'timeout': {
          enum5 = 5;
          break;
        }
        case 'concurrency-conflict': {
          enum5 = 6;
          break;
        }
        case 'not-in-progress': {
          enum5 = 7;
          break;
        }
        case 'would-block': {
          enum5 = 8;
          break;
        }
        case 'invalid-state': {
          enum5 = 9;
          break;
        }
        case 'new-socket-limit': {
          enum5 = 10;
          break;
        }
        case 'address-not-bindable': {
          enum5 = 11;
          break;
        }
        case 'address-in-use': {
          enum5 = 12;
          break;
        }
        case 'remote-unreachable': {
          enum5 = 13;
          break;
        }
        case 'connection-refused': {
          enum5 = 14;
          break;
        }
        case 'connection-reset': {
          enum5 = 15;
          break;
        }
        case 'connection-aborted': {
          enum5 = 16;
          break;
        }
        case 'datagram-too-large': {
          enum5 = 17;
          break;
        }
        case 'name-unresolvable': {
          enum5 = 18;
          break;
        }
        case 'temporary-resolver-failure': {
          enum5 = 19;
          break;
        }
        case 'permanent-resolver-failure': {
          enum5 = 20;
          break;
        }
        default: {
          if ((e) instanceof Error) {
            console.error(e);
          }
          
          throw new TypeError(`"${val5}" is not one of the cases of error-code`);
        }
      }
      dataView(memory0).setInt8(arg3 + 4, enum5, true);
      break;
    }
    default: {
      throw new TypeError('invalid variant specified for result');
    }
  }
}

function trampoline133(arg0, arg1) {
  const ret = getRandomBytes(BigInt.asUintN(64, arg0));
  var val0 = ret;
  var len0 = val0.byteLength;
  var ptr0 = realloc0(0, 0, 1, len0 * 1);
  var src0 = new Uint8Array(val0.buffer || val0, val0.byteOffset, len0 * 1);
  (new Uint8Array(memory0.buffer, ptr0, len0 * 1)).set(src0);
  dataView(memory0).setInt32(arg1 + 4, len0, true);
  dataView(memory0).setInt32(arg1 + 0, ptr0, true);
}

function trampoline134(arg0, arg1) {
  const ret = getInsecureRandomBytes(BigInt.asUintN(64, arg0));
  var val0 = ret;
  var len0 = val0.byteLength;
  var ptr0 = realloc0(0, 0, 1, len0 * 1);
  var src0 = new Uint8Array(val0.buffer || val0, val0.byteOffset, len0 * 1);
  (new Uint8Array(memory0.buffer, ptr0, len0 * 1)).set(src0);
  dataView(memory0).setInt32(arg1 + 4, len0, true);
  dataView(memory0).setInt32(arg1 + 0, ptr0, true);
}

function trampoline135(arg0) {
  const ret = insecureSeed();
  var [tuple0_0, tuple0_1] = ret;
  dataView(memory0).setBigInt64(arg0 + 0, toUint64(tuple0_0), true);
  dataView(memory0).setBigInt64(arg0 + 8, toUint64(tuple0_1), true);
}
let exports2;
let exports3;
let postReturn0;

function run() {
  const ret = exports1['cm32p2|wasi:cli/run@0.2|run']();
  let variant0;
  switch (ret) {
    case 0: {
      variant0= {
        tag: 'ok',
        val: undefined
      };
      break;
    }
    case 1: {
      variant0= {
        tag: 'err',
        val: undefined
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  const retVal = variant0;
  postReturn0(ret);
  if (typeof retVal === 'object' && retVal.tag === 'err') {
    throw new ComponentError(retVal.val);
  }
  return retVal.val;
}
function trampoline1(handle) {
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
function trampoline4(handle) {
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
function trampoline7(handle) {
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
function trampoline8(handle) {
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
function trampoline12(handle) {
  const handleEntry = rscTableRemove(handleTable4, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable4.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable4.delete(handleEntry.rep);
    } else if (TerminalInput[symbolCabiDispose]) {
      TerminalInput[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline13(handle) {
  const handleEntry = rscTableRemove(handleTable5, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable5.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable5.delete(handleEntry.rep);
    } else if (TerminalOutput[symbolCabiDispose]) {
      TerminalOutput[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline19(handle) {
  const handleEntry = rscTableRemove(handleTable6, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable6.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable6.delete(handleEntry.rep);
    } else if (Descriptor[symbolCabiDispose]) {
      Descriptor[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline20(handle) {
  const handleEntry = rscTableRemove(handleTable7, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable7.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable7.delete(handleEntry.rep);
    } else if (DirectoryEntryStream[symbolCabiDispose]) {
      DirectoryEntryStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline21(handle) {
  const handleEntry = rscTableRemove(handleTable8, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable8.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable8.delete(handleEntry.rep);
    } else if (Network[symbolCabiDispose]) {
      Network[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline27(handle) {
  const handleEntry = rscTableRemove(handleTable9, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable9.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable9.delete(handleEntry.rep);
    } else if (UdpSocket[symbolCabiDispose]) {
      UdpSocket[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline28(handle) {
  const handleEntry = rscTableRemove(handleTable10, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable10.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable10.delete(handleEntry.rep);
    } else if (IncomingDatagramStream[symbolCabiDispose]) {
      IncomingDatagramStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline29(handle) {
  const handleEntry = rscTableRemove(handleTable11, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable11.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable11.delete(handleEntry.rep);
    } else if (OutgoingDatagramStream[symbolCabiDispose]) {
      OutgoingDatagramStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline33(handle) {
  const handleEntry = rscTableRemove(handleTable12, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable12.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable12.delete(handleEntry.rep);
    } else if (TcpSocket[symbolCabiDispose]) {
      TcpSocket[symbolCabiDispose](handleEntry.rep);
    }
  }
}
function trampoline35(handle) {
  const handleEntry = rscTableRemove(handleTable13, handle);
  if (handleEntry.own) {
    
    const rsc = captureTable13.get(handleEntry.rep);
    if (rsc) {
      if (rsc[symbolDispose]) rsc[symbolDispose]();
      captureTable13.delete(handleEntry.rep);
    } else if (ResolveAddressStream[symbolCabiDispose]) {
      ResolveAddressStream[symbolCabiDispose](handleEntry.rep);
    }
  }
}

const $init = (() => {
  let gen = (function* init () {
    const module0 = fetchCompile(new URL('./bar.core.wasm', import.meta.url));
    const module1 = fetchCompile(new URL('./bar.core2.wasm', import.meta.url));
    const module2 = base64Compile('AGFzbQEAAAABoQETYAF/AGACf38AYAN/f38AYAN/fn8AYAR/f39/AGAEf39+fwBgBX9+fn9/AGAIf39+f39+f38AYAR/fn5/AGAFf39/fn8AYAV/f39/fwBgC39/f39/fn9/fn9/AGAIf39/f39/f38AYAd/f39/f39/AGAHf39/f39/fwBgBn9/f39/fwBgD39/f39/f39/f39/f39/fwBgA39/fwBgAn5/AALSBGMAATAAAAABMQAAAAEyAAAAATMAAQABNAACAAE1AAMAATYAAwABNwADAAE4AAMAATkAAQACMTAABAACMTEABAACMTIAAQACMTMAAQACMTQAAwACMTUAAwACMTYABQACMTcABQACMTgAAAACMTkAAAACMjAAAAACMjEAAAACMjIAAAACMjMAAwACMjQAAwACMjUAAQACMjYABgACMjcAAQACMjgAAQACMjkAAQACMzAAAwACMzEABwACMzIACAACMzMACQACMzQAAQACMzUAAQACMzYABAACMzcAAQACMzgACgACMzkACwACNDAADAACNDEADQACNDIABAACNDMABAACNDQADgACNDUADwACNDYABAACNDcAAQACNDgACgACNDkAAQACNTAAAQACNTEAAAACNTIAEAACNTMAAQACNTQAEAACNTUAAQACNTYAAQACNTcAAQACNTgAEQACNTkAAQACNjAAAwACNjEAAQACNjIAAwACNjMAAwACNjQAAQACNjUABAACNjYAAQACNjcAEAACNjgAAQACNjkAEAACNzAAAQACNzEAAQACNzIAAQACNzMAAQACNzQAAQACNzUAAQACNzYAAwACNzcAAQACNzgAEQACNzkAAQACODAAAwACODEAAQACODIAAwACODMAAQACODQAEQACODUAAQACODYAEQACODcAAQACODgAAwACODkAAQACOTAAAwACOTEAEQACOTIAAQACOTMAAQACOTQABAACOTUAEgACOTYAEgACOTcAAAAIJGltcG9ydHMBcAFiYgloAQBBAAtiAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGEALwlwcm9kdWNlcnMBDHByb2Nlc3NlZC1ieQENd2l0LWNvbXBvbmVudAcwLjIyMC4wABwEbmFtZQAVFHdpdC1jb21wb25lbnQ6Zml4dXBz');
    const module3 = base64Compile('AGFzbQEAAAABBAFgAAACBQEAAAAACAEA');
    ({ exports: exports0 } = yield instantiateCore(yield module1));
    ({ exports: exports1 } = yield instantiateCore(yield module0, {
      'cm32p2|wasi:cli/environment@0.2': {
        'get-arguments': exports0['1'],
        'get-environment': exports0['0'],
        'initial-cwd': exports0['2'],
      },
      'cm32p2|wasi:cli/exit@0.2': {
        exit: trampoline0,
      },
      'cm32p2|wasi:cli/stderr@0.2': {
        'get-stderr': trampoline11,
      },
      'cm32p2|wasi:cli/stdin@0.2': {
        'get-stdin': trampoline9,
      },
      'cm32p2|wasi:cli/stdout@0.2': {
        'get-stdout': trampoline10,
      },
      'cm32p2|wasi:cli/terminal-input@0.2': {
        'terminal-input_drop': trampoline12,
      },
      'cm32p2|wasi:cli/terminal-output@0.2': {
        'terminal-output_drop': trampoline13,
      },
      'cm32p2|wasi:cli/terminal-stderr@0.2': {
        'get-terminal-stderr': exports0['20'],
      },
      'cm32p2|wasi:cli/terminal-stdin@0.2': {
        'get-terminal-stdin': exports0['18'],
      },
      'cm32p2|wasi:cli/terminal-stdout@0.2': {
        'get-terminal-stdout': exports0['19'],
      },
      'cm32p2|wasi:clocks/monotonic-clock@0.2': {
        now: trampoline14,
        resolution: trampoline15,
        'subscribe-duration': trampoline17,
        'subscribe-instant': trampoline16,
      },
      'cm32p2|wasi:clocks/wall-clock@0.2': {
        now: exports0['21'],
        resolution: exports0['22'],
      },
      'cm32p2|wasi:filesystem/preopens@0.2': {
        'get-directories': exports0['51'],
      },
      'cm32p2|wasi:filesystem/types@0.2': {
        '[method]descriptor.advise': exports0['26'],
        '[method]descriptor.append-via-stream': exports0['25'],
        '[method]descriptor.create-directory-at': exports0['36'],
        '[method]descriptor.get-flags': exports0['28'],
        '[method]descriptor.get-type': exports0['29'],
        '[method]descriptor.is-same-object': trampoline18,
        '[method]descriptor.link-at': exports0['40'],
        '[method]descriptor.metadata-hash': exports0['47'],
        '[method]descriptor.metadata-hash-at': exports0['48'],
        '[method]descriptor.open-at': exports0['41'],
        '[method]descriptor.read': exports0['32'],
        '[method]descriptor.read-directory': exports0['34'],
        '[method]descriptor.read-via-stream': exports0['23'],
        '[method]descriptor.readlink-at': exports0['42'],
        '[method]descriptor.remove-directory-at': exports0['43'],
        '[method]descriptor.rename-at': exports0['44'],
        '[method]descriptor.set-size': exports0['30'],
        '[method]descriptor.set-times': exports0['31'],
        '[method]descriptor.set-times-at': exports0['39'],
        '[method]descriptor.stat': exports0['37'],
        '[method]descriptor.stat-at': exports0['38'],
        '[method]descriptor.symlink-at': exports0['45'],
        '[method]descriptor.sync': exports0['35'],
        '[method]descriptor.sync-data': exports0['27'],
        '[method]descriptor.unlink-file-at': exports0['46'],
        '[method]descriptor.write': exports0['33'],
        '[method]descriptor.write-via-stream': exports0['24'],
        '[method]directory-entry-stream.read-directory-entry': exports0['49'],
        descriptor_drop: trampoline19,
        'directory-entry-stream_drop': trampoline20,
        'filesystem-error-code': exports0['50'],
      },
      'cm32p2|wasi:io/error@0.2': {
        '[method]error.to-debug-string': exports0['3'],
        error_drop: trampoline1,
      },
      'cm32p2|wasi:io/poll@0.2': {
        '[method]pollable.block': trampoline3,
        '[method]pollable.ready': trampoline2,
        poll: exports0['4'],
        pollable_drop: trampoline4,
      },
      'cm32p2|wasi:io/streams@0.2': {
        '[method]input-stream.blocking-read': exports0['6'],
        '[method]input-stream.blocking-skip': exports0['8'],
        '[method]input-stream.read': exports0['5'],
        '[method]input-stream.skip': exports0['7'],
        '[method]input-stream.subscribe': trampoline5,
        '[method]output-stream.blocking-flush': exports0['13'],
        '[method]output-stream.blocking-splice': exports0['17'],
        '[method]output-stream.blocking-write-and-flush': exports0['11'],
        '[method]output-stream.blocking-write-zeroes-and-flush': exports0['15'],
        '[method]output-stream.check-write': exports0['9'],
        '[method]output-stream.flush': exports0['12'],
        '[method]output-stream.splice': exports0['16'],
        '[method]output-stream.subscribe': trampoline6,
        '[method]output-stream.write': exports0['10'],
        '[method]output-stream.write-zeroes': exports0['14'],
        'input-stream_drop': trampoline7,
        'output-stream_drop': trampoline8,
      },
      'cm32p2|wasi:random/insecure-seed@0.2': {
        'insecure-seed': exports0['97'],
      },
      'cm32p2|wasi:random/insecure@0.2': {
        'get-insecure-random-bytes': exports0['96'],
        'get-insecure-random-u64': trampoline37,
      },
      'cm32p2|wasi:random/random@0.2': {
        'get-random-bytes': exports0['95'],
        'get-random-u64': trampoline36,
      },
      'cm32p2|wasi:sockets/instance-network@0.2': {
        'instance-network': trampoline22,
      },
      'cm32p2|wasi:sockets/ip-name-lookup@0.2': {
        '[method]resolve-address-stream.resolve-next-address': exports0['93'],
        '[method]resolve-address-stream.subscribe': trampoline34,
        'resolve-address-stream_drop': trampoline35,
        'resolve-addresses': exports0['94'],
      },
      'cm32p2|wasi:sockets/network@0.2': {
        network_drop: trampoline21,
      },
      'cm32p2|wasi:sockets/tcp-create-socket@0.2': {
        'create-tcp-socket': exports0['92'],
      },
      'cm32p2|wasi:sockets/tcp@0.2': {
        '[method]tcp-socket.accept': exports0['73'],
        '[method]tcp-socket.address-family': trampoline31,
        '[method]tcp-socket.finish-bind': exports0['68'],
        '[method]tcp-socket.finish-connect': exports0['70'],
        '[method]tcp-socket.finish-listen': exports0['72'],
        '[method]tcp-socket.hop-limit': exports0['85'],
        '[method]tcp-socket.is-listening': trampoline30,
        '[method]tcp-socket.keep-alive-count': exports0['83'],
        '[method]tcp-socket.keep-alive-enabled': exports0['77'],
        '[method]tcp-socket.keep-alive-idle-time': exports0['79'],
        '[method]tcp-socket.keep-alive-interval': exports0['81'],
        '[method]tcp-socket.local-address': exports0['74'],
        '[method]tcp-socket.receive-buffer-size': exports0['87'],
        '[method]tcp-socket.remote-address': exports0['75'],
        '[method]tcp-socket.send-buffer-size': exports0['89'],
        '[method]tcp-socket.set-hop-limit': exports0['86'],
        '[method]tcp-socket.set-keep-alive-count': exports0['84'],
        '[method]tcp-socket.set-keep-alive-enabled': exports0['78'],
        '[method]tcp-socket.set-keep-alive-idle-time': exports0['80'],
        '[method]tcp-socket.set-keep-alive-interval': exports0['82'],
        '[method]tcp-socket.set-listen-backlog-size': exports0['76'],
        '[method]tcp-socket.set-receive-buffer-size': exports0['88'],
        '[method]tcp-socket.set-send-buffer-size': exports0['90'],
        '[method]tcp-socket.shutdown': exports0['91'],
        '[method]tcp-socket.start-bind': exports0['67'],
        '[method]tcp-socket.start-connect': exports0['69'],
        '[method]tcp-socket.start-listen': exports0['71'],
        '[method]tcp-socket.subscribe': trampoline32,
        'tcp-socket_drop': trampoline33,
      },
      'cm32p2|wasi:sockets/udp-create-socket@0.2': {
        'create-udp-socket': exports0['66'],
      },
      'cm32p2|wasi:sockets/udp@0.2': {
        '[method]incoming-datagram-stream.receive': exports0['63'],
        '[method]incoming-datagram-stream.subscribe': trampoline25,
        '[method]outgoing-datagram-stream.check-send': exports0['64'],
        '[method]outgoing-datagram-stream.send': exports0['65'],
        '[method]outgoing-datagram-stream.subscribe': trampoline26,
        '[method]udp-socket.address-family': trampoline23,
        '[method]udp-socket.finish-bind': exports0['53'],
        '[method]udp-socket.local-address': exports0['55'],
        '[method]udp-socket.receive-buffer-size': exports0['59'],
        '[method]udp-socket.remote-address': exports0['56'],
        '[method]udp-socket.send-buffer-size': exports0['61'],
        '[method]udp-socket.set-receive-buffer-size': exports0['60'],
        '[method]udp-socket.set-send-buffer-size': exports0['62'],
        '[method]udp-socket.set-unicast-hop-limit': exports0['58'],
        '[method]udp-socket.start-bind': exports0['52'],
        '[method]udp-socket.stream': exports0['54'],
        '[method]udp-socket.subscribe': trampoline24,
        '[method]udp-socket.unicast-hop-limit': exports0['57'],
        'incoming-datagram-stream_drop': trampoline28,
        'outgoing-datagram-stream_drop': trampoline29,
        'udp-socket_drop': trampoline27,
      },
    }));
    memory0 = exports1.cm32p2_memory;
    realloc0 = exports1.cm32p2_realloc;
    ({ exports: exports2 } = yield instantiateCore(yield module2, {
      '': {
        $imports: exports0.$imports,
        '0': trampoline38,
        '1': trampoline39,
        '10': trampoline48,
        '11': trampoline49,
        '12': trampoline50,
        '13': trampoline51,
        '14': trampoline52,
        '15': trampoline53,
        '16': trampoline54,
        '17': trampoline55,
        '18': trampoline56,
        '19': trampoline57,
        '2': trampoline40,
        '20': trampoline58,
        '21': trampoline59,
        '22': trampoline60,
        '23': trampoline61,
        '24': trampoline62,
        '25': trampoline63,
        '26': trampoline64,
        '27': trampoline65,
        '28': trampoline66,
        '29': trampoline67,
        '3': trampoline41,
        '30': trampoline68,
        '31': trampoline69,
        '32': trampoline70,
        '33': trampoline71,
        '34': trampoline72,
        '35': trampoline73,
        '36': trampoline74,
        '37': trampoline75,
        '38': trampoline76,
        '39': trampoline77,
        '4': trampoline42,
        '40': trampoline78,
        '41': trampoline79,
        '42': trampoline80,
        '43': trampoline81,
        '44': trampoline82,
        '45': trampoline83,
        '46': trampoline84,
        '47': trampoline85,
        '48': trampoline86,
        '49': trampoline87,
        '5': trampoline43,
        '50': trampoline88,
        '51': trampoline89,
        '52': trampoline90,
        '53': trampoline91,
        '54': trampoline92,
        '55': trampoline93,
        '56': trampoline94,
        '57': trampoline95,
        '58': trampoline96,
        '59': trampoline97,
        '6': trampoline44,
        '60': trampoline98,
        '61': trampoline99,
        '62': trampoline100,
        '63': trampoline101,
        '64': trampoline102,
        '65': trampoline103,
        '66': trampoline104,
        '67': trampoline105,
        '68': trampoline106,
        '69': trampoline107,
        '7': trampoline45,
        '70': trampoline108,
        '71': trampoline109,
        '72': trampoline110,
        '73': trampoline111,
        '74': trampoline112,
        '75': trampoline113,
        '76': trampoline114,
        '77': trampoline115,
        '78': trampoline116,
        '79': trampoline117,
        '8': trampoline46,
        '80': trampoline118,
        '81': trampoline119,
        '82': trampoline120,
        '83': trampoline121,
        '84': trampoline122,
        '85': trampoline123,
        '86': trampoline124,
        '87': trampoline125,
        '88': trampoline126,
        '89': trampoline127,
        '9': trampoline47,
        '90': trampoline128,
        '91': trampoline129,
        '92': trampoline130,
        '93': trampoline131,
        '94': trampoline132,
        '95': trampoline133,
        '96': trampoline134,
        '97': trampoline135,
      },
    }));
    ({ exports: exports3 } = yield instantiateCore(yield module3, {
      '': {
        '': exports1.cm32p2_initialize,
      },
    }));
    postReturn0 = exports1['cm32p2|wasi:cli/run@0.2|run_post'];
  })();
  let promise, resolve, reject;
  function runNext (value) {
    try {
      let done;
      do {
        ({ value, done } = gen.next(value));
      } while (!(value instanceof Promise) && !done);
      if (done) {
        if (resolve) resolve(value);
        else return value;
      }
      if (!promise) promise = new Promise((_resolve, _reject) => (resolve = _resolve, reject = _reject));
      value.then(runNext, reject);
    }
    catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }
  const maybeSyncReturn = runNext(null);
  return promise || maybeSyncReturn;
})();

await $init;
const run020 = {
  run: run,
  
};

export { run020 as run, run020 as 'wasi:cli/run@0.2.0',  }