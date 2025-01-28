import { describe, expect, it, test } from "vitest";
import { BigEndianDataView, LittleEndianDataView } from "./endian_data_view";

expect.addSnapshotSerializer({
  serialize(
    val: ArrayBufferView,
    _config,
    _indentation,
    _depth,
    _refs,
    _printer,
  ): string {
    const bytes = new Uint8Array(val.buffer, val.byteOffset, val.byteLength);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      " ",
    );
  },
  test(val: unknown): val is ArrayBufferView {
    return ArrayBuffer.isView(val);
  },
});

describe("EndianDataView", () => {
  test("LittleEndianDataView works", () => {
    const test = new LittleEndianDataView(46);
    test.setUint32(0, 0xdeadbeef);
    test.setUint32(4, 0xfeedface);
    test.setInt16(8, -1234);
    test.setInt8(10, -12);
    test.setUint8(11, 0xff);
    test.setUint16(12, 0xdead);
    test.setFloat32(14, 1.2345);
    test.setFloat64(18, 1.2345);
    test.setBigInt64(26, -0x0102030405060708n);
    test.setBigUint64(34, 0xbadf00dcafebaben);
    test.setInt32(42, -7654321);
    expect(test).toMatchInlineSnapshot(
      `ef be ad de ce fa ed fe 2e fb f4 ff ad de 19 04 9e 3f 8d 97 6e 12 83 c0 f3 3f f8 f8 f9 fa fb fc fd fe be ba fe ca 0d f0 ad 0b 4f 34 8b ff`,
    );

    // roundtrip
    expect(test.subarray(0).subarray(0, 4)).toMatchInlineSnapshot(
      `ef be ad de`,
    );
    expect.soft(test.getUint32(0)).toStrictEqual(0xdeadbeef);

    expect(test.subarray(4).subarray(0, 4)).toMatchInlineSnapshot(
      `ce fa ed fe`,
    );
    expect.soft(test.getUint32(4)).toStrictEqual(0xfeedface);

    expect(test.subarray(8).subarray(0, 2)).toMatchInlineSnapshot(`2e fb`);
    expect.soft(test.getInt16(8)).toStrictEqual(-1234);

    expect(test.subarray(10).subarray(0, 1)).toMatchInlineSnapshot(`f4`);
    expect.soft(test.getInt8(10)).toStrictEqual(-12);

    expect(test.subarray(11).subarray(0, 1)).toMatchInlineSnapshot(`ff`);
    expect.soft(test.getUint8(11)).toStrictEqual(0xff);

    expect(test.subarray(12).subarray(0, 2)).toMatchInlineSnapshot(`ad de`);
    expect.soft(test.getUint16(12)).toStrictEqual(0xdead);

    expect(test.subarray(14).subarray(0, 4)).toMatchInlineSnapshot(
      `19 04 9e 3f`,
    );
    expect.soft(test.getFloat32(14)).toBeCloseTo(1.2345, 6);

    expect(test.subarray(18).subarray(0, 8)).toMatchInlineSnapshot(
      `8d 97 6e 12 83 c0 f3 3f`,
    );
    expect.soft(test.getFloat64(18)).toBeCloseTo(1.2345, 6);

    expect(test.subarray(26).subarray(0, 8)).toMatchInlineSnapshot(
      `f8 f8 f9 fa fb fc fd fe`,
    );
    expect.soft(test.getBigInt64(26)).toStrictEqual(-0x0102030405060708n);

    expect(test.subarray(34).subarray(0, 8)).toMatchInlineSnapshot(
      `be ba fe ca 0d f0 ad 0b`,
    );
    expect.soft(test.getBigUint64(34)).toStrictEqual(0xbadf00dcafebaben);

    expect(test.subarray(42).subarray(0, 4)).toMatchInlineSnapshot(
      `4f 34 8b ff`,
    );
    expect.soft(test.getInt32(42)).toStrictEqual(-7654321);

    // strange offsets and wrong types
    expect(test.subarray(3).subarray(0, 8)).toMatchInlineSnapshot(
      `de ce fa ed fe 2e fb f4`,
    );
    expect.soft(test.getBigUint64(3)).toStrictEqual(0xf4fb2efeedfaceden);

    expect(test.subarray(3).subarray(0, 8)).toMatchInlineSnapshot(
      `de ce fa ed fe 2e fb f4`,
    );
    expect.soft(test.getBigInt64(3)).toStrictEqual(-0xb04d10112053122n);

    expect(test.subarray(1).subarray(0, 1)).toMatchInlineSnapshot(`be`);
    expect.soft(test.getUint8(1)).toStrictEqual(0xbe);

    expect(test.subarray(3).subarray(0, 1)).toMatchInlineSnapshot(`de`);
    expect.soft(test.getInt8(3)).toStrictEqual(-0x22);

    expect(test.subarray(3).subarray(0, 2)).toMatchInlineSnapshot(`de ce`);
    expect.soft(test.getUint16(3)).toStrictEqual(0xcede);

    expect(test.subarray(3).subarray(0, 2)).toMatchInlineSnapshot(`de ce`);
    expect.soft(test.getInt16(3)).toStrictEqual(-0x3122);

    expect(test.subarray(6).subarray(0, 4)).toMatchInlineSnapshot(
      `ed fe 2e fb`,
    );
    expect.soft(test.getInt32(6)).toStrictEqual(-0x04d10113);

    expect(test.subarray(5).subarray(0, 4)).toMatchInlineSnapshot(
      `fa ed fe 2e`,
    );
    expect.soft(test.getUint32(5)).toStrictEqual(0x2efeedfa);

    expect(test.subarray(12).subarray(0, 4)).toMatchInlineSnapshot(
      `ad de 19 04`,
    );
    expect.soft(test.getFloat32(12)).toBeCloseTo(0, 6);

    expect(test.subarray(16).subarray(0, 8)).toMatchInlineSnapshot(
      `9e 3f 8d 97 6e 12 83 c0`,
    );
    expect.soft(test.getFloat64(16)).toBeCloseTo(-610.3039999, 6);
  });

  test("BigEndianDataView works", () => {
    const test = new BigEndianDataView(46);
    test.setUint32(0, 0xdeadbeef);
    test.setUint32(4, 0xfeedface);
    test.setInt16(8, -1234);
    test.setInt8(10, -12);
    test.setUint8(11, 0xff);
    test.setUint16(12, 0xdead);
    test.setFloat32(14, 1.2345);
    test.setFloat64(18, 1.2345);
    test.setBigInt64(26, -0x0102030405060708n);
    test.setBigUint64(34, 0xbadf00dcafebaben);
    test.setInt32(42, -7654321);
    expect(test).toMatchInlineSnapshot(
      `de ad be ef fe ed fa ce fb 2e f4 ff de ad 3f 9e 04 19 3f f3 c0 83 12 6e 97 8d fe fd fc fb fa f9 f8 f8 0b ad f0 0d ca fe ba be ff 8b 34 4f`,
    );

    // roundtrip
    expect(test.subarray(0).subarray(0, 4)).toMatchInlineSnapshot(
      `de ad be ef`,
    );
    expect.soft(test.getUint32(0)).toStrictEqual(0xdeadbeef);

    expect(test.subarray(4).subarray(0, 4)).toMatchInlineSnapshot(
      `fe ed fa ce`,
    );
    expect.soft(test.getUint32(4)).toStrictEqual(0xfeedface);

    expect(test.subarray(8).subarray(0, 2)).toMatchInlineSnapshot(`fb 2e`);
    expect.soft(test.getInt16(8)).toStrictEqual(-1234);

    expect(test.subarray(10).subarray(0, 1)).toMatchInlineSnapshot(`f4`);
    expect.soft(test.getInt8(10)).toStrictEqual(-12);

    expect(test.subarray(11).subarray(0, 1)).toMatchInlineSnapshot(`ff`);
    expect.soft(test.getUint8(11)).toStrictEqual(0xff);

    expect(test.subarray(12).subarray(0, 2)).toMatchInlineSnapshot(`de ad`);
    expect.soft(test.getUint16(12)).toStrictEqual(0xdead);

    expect(test.subarray(14).subarray(0, 4)).toMatchInlineSnapshot(
      `3f 9e 04 19`,
    );
    expect.soft(test.getFloat32(14)).toBeCloseTo(1.2345, 6);

    expect(test.subarray(18).subarray(0, 8)).toMatchInlineSnapshot(
      `3f f3 c0 83 12 6e 97 8d`,
    );
    expect.soft(test.getFloat64(18)).toBeCloseTo(1.2345, 6);

    expect(test.subarray(26).subarray(0, 8)).toMatchInlineSnapshot(
      `fe fd fc fb fa f9 f8 f8`,
    );
    expect.soft(test.getBigInt64(26)).toStrictEqual(-0x0102030405060708n);

    expect(test.subarray(34).subarray(0, 8)).toMatchInlineSnapshot(
      `0b ad f0 0d ca fe ba be`,
    );
    expect.soft(test.getBigUint64(34)).toStrictEqual(0xbadf00dcafebaben);

    expect(test.subarray(42).subarray(0, 4)).toMatchInlineSnapshot(
      `ff 8b 34 4f`,
    );
    expect.soft(test.getInt32(42)).toStrictEqual(-7654321);

    // strange offsets and wrong types
    expect(test.subarray(3).subarray(0, 8)).toMatchInlineSnapshot(
      `ef fe ed fa ce fb 2e f4`,
    );
    expect.soft(test.getBigUint64(3)).toStrictEqual(0xeffeedfacefb2ef4n);

    expect(test.subarray(3).subarray(0, 8)).toMatchInlineSnapshot(
      `ef fe ed fa ce fb 2e f4`,
    );
    expect.soft(test.getBigInt64(3)).toStrictEqual(-0x100112053104d10cn);

    expect(test.subarray(1).subarray(0, 1)).toMatchInlineSnapshot(`ad`);
    expect.soft(test.getUint8(1)).toStrictEqual(0xad);

    expect(test.subarray(3).subarray(0, 1)).toMatchInlineSnapshot(`ef`);
    expect.soft(test.getInt8(3)).toStrictEqual(-0x11);

    expect(test.subarray(3).subarray(0, 2)).toMatchInlineSnapshot(`ef fe`);
    expect.soft(test.getUint16(3)).toStrictEqual(0xeffe);

    expect(test.subarray(3).subarray(0, 2)).toMatchInlineSnapshot(`ef fe`);
    expect.soft(test.getInt16(3)).toStrictEqual(-0x1002);

    expect(test.subarray(6).subarray(0, 4)).toMatchInlineSnapshot(
      `fa ce fb 2e`,
    );
    expect.soft(test.getInt32(6)).toStrictEqual(-0x053104d2);

    expect(test.subarray(5).subarray(0, 4)).toMatchInlineSnapshot(
      `ed fa ce fb`,
    );
    expect.soft(test.getUint32(5)).toStrictEqual(0xedfacefb);

    expect(test.subarray(12).subarray(0, 4)).toMatchInlineSnapshot(
      `de ad 3f 9e`,
    );
    expect.soft(test.getFloat32(12)).toBeCloseTo(-6241935207465746000, 6);

    expect(test.subarray(16).subarray(0, 8)).toMatchInlineSnapshot(
      `04 19 3f f3 c0 83 12 6e`,
    );
    expect.soft(test.getFloat64(16)).toBeCloseTo(0, 6);
  });
  describe("stride", () => {
    it("works", () => {
      const test = new LittleEndianDataView(10);
      for (let i = 0; i < test.byteLength; i++) {
        test[i] = 0x10 + i;
      }
      expect(test).toMatchInlineSnapshot(`10 11 12 13 14 15 16 17 18 19`);

      const iter = test.stride(3, 2, 2);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": 13 14,
        }
      `);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": 15 16,
        }
      `);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": true,
          "value": 17 18 19,
        }
      `);
    });
    it("works unbounded & unaligned", () => {
      const test = new LittleEndianDataView(10);
      for (let i = 0; i < test.byteLength; i++) {
        test[i] = 0x10 + i;
      }
      expect(test).toMatchInlineSnapshot(`10 11 12 13 14 15 16 17 18 19`);

      const iter = test.stride(3, 2);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": 13 14,
        }
      `);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": 15 16,
        }
      `);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": 17 18,
        }
      `);
      expect(iter.next()).toMatchInlineSnapshot(`
        {
          "done": true,
          "value": 19,
        }
      `);
    });
  });
  test("setBytes works", () => {
    const test = new LittleEndianDataView(10);
    for (let i = 0; i < test.byteLength; i++) {
      test[i] = 0x10 + i;
    }
    expect(test).toMatchInlineSnapshot(`10 11 12 13 14 15 16 17 18 19`);

    const newData = new Uint8Array([0x20, 0x21, 0x22, 0x23]);
    expect(test.setBytes(newData, 3)).toMatchInlineSnapshot(`17 18 19`);
    expect(test).toMatchInlineSnapshot(`10 11 12 20 21 22 23 17 18 19`);

    expect(test.setBytes(newData)).toMatchInlineSnapshot(`21 22 23 17 18 19`);
    expect(test).toMatchInlineSnapshot(`20 21 22 23 21 22 23 17 18 19`);
  });
});
