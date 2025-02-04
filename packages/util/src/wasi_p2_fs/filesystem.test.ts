import { expect, test } from "vitest";
import { Descriptor } from "./descriptor";
import { Node } from "./node";
import { MapDirectoryDelegate } from "./node/dir";

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

test("things", () => {
  Node.now = () => ({
    seconds: 1234n,
    nanoseconds: 5678,
  });

  const root = new Descriptor(
    {
      read: true,
      write: true,
      mutateDirectory: true,
    },
    new Node(new MapDirectoryDelegate()),
  );

  root.symlinkAt("foo/bar", "baz");

  expect(Array.from(root.readDirectory())).toMatchInlineSnapshot(`
    [
      {
        "name": "baz",
        "type": "symbolic-link",
      },
    ]
  `);

  root.createDirectoryAt("foo");

  expect(
    root
      .openAt({}, "foo/bar", { create: true }, { read: true, write: true })
      .write(new TextEncoder().encode("baz"), 0n),
  ).toMatchInlineSnapshot(`3n`);

  expect(Array.from(root.readDirectory())).toMatchInlineSnapshot(`
    [
      {
        "name": "baz",
        "type": "symbolic-link",
      },
      {
        "name": "foo",
        "type": "directory",
      },
    ]
  `);

  expect(
    Array.from(root.openAt({}, ".", {}, { read: true }).readDirectory()),
  ).toMatchInlineSnapshot(`
    [
      {
        "name": "baz",
        "type": "symbolic-link",
      },
      {
        "name": "foo",
        "type": "directory",
      },
    ]
  `);

  expect(
    Array.from(root.openAt({}, "foo", {}, { read: true }).readDirectory()),
  ).toMatchInlineSnapshot(`
    [
      {
        "name": "bar",
        "type": "regular-file",
      },
    ]
  `);

  expect(root.statAt({}, "foo")).toMatchInlineSnapshot(`
    {
      "dataAccessTimestamp": {
        "nanoseconds": 5678,
        "seconds": 1234n,
      },
      "dataModificationTimestamp": {
        "nanoseconds": 5678,
        "seconds": 1234n,
      },
      "linkCount": 1n,
      "size": 0n,
      "statusChangeTimestamp": {
        "nanoseconds": 5678,
        "seconds": 1234n,
      },
      "type": "directory",
    }
  `);

  expect(
    root.openAt({}, "foo/bar", {}, { read: true }).read(2n ** 64n - 1n, 0n),
  ).toMatchInlineSnapshot(`
    [
      62 61 7a,
      true,
    ]
  `);

  expect(
    root
      .openAt({ symlinkFollow: true }, "baz", {}, { read: true })
      .read(2n ** 64n - 1n, 0n),
  ).toMatchInlineSnapshot(`
    [
      62 61 7a,
      true,
    ]
  `);

  expect(
    root
      .openAt({ symlinkFollow: false }, "baz", {}, { read: true })
      .read(2n ** 64n - 1n, 0n),
  ).toMatchInlineSnapshot(`
    [
      66 6f 6f 2f 62 61 72,
      true,
    ]
  `);
});
