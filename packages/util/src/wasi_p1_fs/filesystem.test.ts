import { type TestFunction, describe, expect, it } from "vitest";
import { LittleEndianDataView } from "../endian_data_view";
import {
  type Pointer,
  type dircookie,
  dirent,
  errno,
  type fd,
  fdflags,
  fdstat,
  filestat,
  type iovec,
  lookupflags,
  oflags,
  prestat,
  type size,
  type u8,
} from "../wasi_p1_defs";
import { WasiP1Filesystem } from "./filesystem";

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

function translateErrno(e: errno): string {
  const [k] = Object.entries(errno).filter(([_k, v]) => v === e)[0];
  return `errno.${k}`;
}

function catchErrno(fn: TestFunction<object>): TestFunction<object> {
  return async (...args: Parameters<TestFunction<object>>) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (typeof e !== "number") throw e;
      throw translateErrno(e as errno);
    }
  };
}

describe("WasiP1Filesystem", () => {
  it(
    "works",
    catchErrno(() => {
      const mem = new WebAssembly.Memory({
        initial: 1,
      });
      const view = new LittleEndianDataView(
        mem.buffer,
        0,
        mem.buffer.byteLength,
      );
      const test = new WasiP1Filesystem(mem.buffer, [
        // [
        //   "",
        //   new FsDir([
        //     ["dev", new FsDir()],
        //     ["tmp", new FsDir()],
        //     [
        //       "etc",
        //       new FsDir([
        //         [
        //           "test.conf",
        //           new FsFile(new TextEncoder().encode("Hello, world!")),
        //         ],
        //       ]),
        //     ],
        //   ]),
        // ],
        // [
        //   "foo",
        //   new FsDir([["bar", new FsFile(new TextEncoder().encode("baz"))]]),
        // ],
      ]);
      expect(test instanceof WasiP1Filesystem);
      const imports = test.imports;

      expect(
        translateErrno(imports.fd_prestat_get(3 as fd, 0 as Pointer<prestat>)),
      ).toStrictEqual("errno.success");
      expect(view.subarray(0, prestat.SIZE)).toMatchInlineSnapshot(
        `00 00 00 00 03 00 00 00`,
      );
      const prestatFd3 = prestat.read(view, 0 as Pointer<prestat>);
      expect(prestatFd3).toMatchInlineSnapshot(`
      [
        0,
        [
          3,
        ],
      ]
    `);

      expect(
        translateErrno(imports.fd_prestat_get(4 as fd, 0 as Pointer<prestat>)),
      ).toStrictEqual("errno.success");
      expect(view.subarray(0, prestat.SIZE)).toMatchInlineSnapshot(
        `00 00 00 00 03 00 00 00`,
      );
      const prestatFd4 = prestat.read(view, 0 as Pointer<prestat>);
      expect(prestatFd4).toMatchInlineSnapshot(`
      [
        0,
        [
          3,
        ],
      ]
    `);

      const prestat4NamePtr = 1024 as Pointer<u8>;
      const prestat4NameLen = prestatFd4[1][0];
      expect(
        translateErrno(
          imports.fd_prestat_dir_name(
            4 as fd,
            prestat4NamePtr,
            prestat4NameLen,
          ),
        ),
      ).toStrictEqual("errno.success");
      const prestat4NameView = view.subarray(
        prestat4NamePtr,
        prestat4NamePtr + prestat4NameLen,
      );
      expect(prestat4NameView).toMatchInlineSnapshot(`66 6f 6f`);
      expect(new TextDecoder().decode(prestat4NameView)).toMatchInlineSnapshot(
        `"foo"`,
      );

      expect(
        translateErrno(
          imports.fd_readdir(
            4 as fd,
            2048 as Pointer<u8>,
            1024 as size,
            0n as dircookie,
            0 as Pointer<size>,
          ),
        ),
      ).toStrictEqual("errno.success");
      const direntLen = view.getUint32(0);
      expect(direntLen).toStrictEqual(
        dirent.SIZE + 1 + dirent.SIZE + 2 + dirent.SIZE + 3,
      );
      expect(view.subarray(2048).subarray(0, direntLen)).toMatchInlineSnapshot(
        `01 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 2e 02 00 00 00 00 00 00 00 02 00 00 00 00 00 00 00 02 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 2e 2e 03 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 04 00 00 00 00 00 00 00 62 61 72`,
      );

      expect(
        Array.from(
          (function* () {
            let ptr = 2048;
            while (ptr < 2048 + direntLen) {
              const dirent_ = dirent.read(view, ptr as Pointer<dirent>);
              ptr += dirent.SIZE;
              const nameLen = dirent_[2];
              const name = new TextDecoder().decode(
                view.subarray(ptr).subarray(0, nameLen),
              );
              ptr += nameLen;
              yield [dirent_, name];
            }
          })(),
        ),
      ).toMatchInlineSnapshot(`
        [
          [
            [
              1n,
              1n,
              1,
              3,
            ],
            ".",
          ],
          [
            [
              2n,
              2n,
              2,
              3,
            ],
            "..",
          ],
          [
            [
              3n,
              3n,
              3,
              4,
            ],
            "bar",
          ],
        ]
      `);

      // can't traverse above topmost directory
      (() => {
        const pathBuf = new TextEncoder().encode("..");
        const pathBufPtr = 2048 as Pointer<u8>;
        view.subarray(pathBufPtr).set(pathBuf);
        expect(
          translateErrno(
            imports.path_filestat_get(
              4 as fd,
              lookupflags.none,
              pathBufPtr,
              pathBuf.byteLength as size,
              0 as Pointer<filestat>,
            ),
          ),
        ).toStrictEqual("errno.acces");
      })();

      // can stat, fdstat, open, and read "bar"
      (() => {
        const pathBuf = new TextEncoder().encode("bar");
        const pathBufPtr = 2048 as Pointer<u8>;
        view.subarray(pathBufPtr).set(pathBuf);
        expect(
          translateErrno(
            imports.path_filestat_get(
              4 as fd,
              lookupflags.none,
              pathBufPtr,
              pathBuf.byteLength as size,
              0 as Pointer<filestat>,
            ),
          ),
        ).toStrictEqual("errno.success");
        expect(view.subarray(0, filestat.SIZE)).toMatchInlineSnapshot(
          `00 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 04 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00`,
        );
        const stat = filestat.read(view, 0 as Pointer<filestat>);
        expect(stat).toMatchInlineSnapshot(`
        [
          0n,
          3n,
          4,
          1n,
          3,
          0n,
          0n,
          0n,
        ]
      `);

        expect(
          translateErrno(imports.fd_fdstat_get(4 as fd, 0 as Pointer<fdstat>)),
        ).toStrictEqual("errno.success");
        const fdstat_ = fdstat.read(view, 0 as Pointer<fdstat>);
        expect(fdstat_).toMatchInlineSnapshot(`
        [
          3,
          0,
          1073741823n,
          1073741823n,
        ]
      `);

        expect(
          translateErrno(
            imports.path_open(
              4 as fd,
              lookupflags.none,
              pathBufPtr,
              pathBuf.byteLength as size,
              oflags.none,
              fdstat_[3],
              fdstat_[3],
              fdflags.none,
              0 as Pointer<fd>,
            ),
          ),
        ).toStrictEqual("errno.success");
        const newFd = view.getUint32(0) as fd;
        expect(newFd).toMatchInlineSnapshot(`5`);
        view.setUint32(0, 12);
        view.setUint32(4, 1024);
        expect(
          translateErrno(
            imports.fd_read(
              newFd,
              0 as Pointer<iovec>,
              1 as size,
              8 as Pointer<size>,
            ),
          ),
        ).toStrictEqual("errno.success");
        const readLen = view.getUint32(8);
        expect(readLen).toBeLessThan(1024);
        const buf = view.subarray(12).subarray(0, readLen);
        expect(buf).toMatchInlineSnapshot(`62 61 7a`);
        expect(new TextDecoder().decode(buf)).toStrictEqual("baz");

        // close works
        expect(translateErrno(imports.fd_close(newFd))).toStrictEqual(
          "errno.success",
        );
        // double-close doesn't
        expect(translateErrno(imports.fd_close(newFd))).toStrictEqual(
          "errno.badf",
        );
      })();

      // gets noent for non-existent file
      (() => {
        const pathBuf = new TextEncoder().encode("baz");
        const pathBufPtr = 2048 as Pointer<u8>;
        view.subarray(pathBufPtr).set(pathBuf);
        expect(
          translateErrno(
            imports.path_filestat_get(
              4 as fd,
              lookupflags.none,
              pathBufPtr,
              pathBuf.byteLength as size,
              0 as Pointer<filestat>,
            ),
          ),
        ).toStrictEqual("errno.noent");
      })();
    }),
  );
});
