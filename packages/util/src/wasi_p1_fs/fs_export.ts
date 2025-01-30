import type { ErrorCode } from "../../../../output/interfaces/wasi-filesystem-types";
import { assume } from "../index";
import { errno, type fd, rights } from "../wasi_p1_defs";
import type { FdRec } from "./fd_rec";
import { errorCodeToErrno } from "./p2_adapters";

// biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
export type FsImport<T extends (...args: any) => void> = T & {
  readonly [wasiP1FsImport.BRAND]: never;
  readonly [wasiP1FsImport.RIGHTS]: rights;
  readonly [wasiP1FsImport.DIR_ONLY]: boolean;
  readonly [wasiP1FsImport.FILE_ONLY]: boolean;
  readonly [wasiP1FsImport.FD_INDEX]: number;
};

export function wasiP1FsImport<T>(params?: {
  rights?: rights;
  dirOnly?: true;
  fileOnly?: true;
  fdIndex?: number;
}) {
  // biome-ignore lint/style/noParameterAssign:
  params ??= {};
  params.rights ??= rights.none;
  params.fdIndex ??= 0;
  return <
    This extends {
      readonly [wasiP1FsImport.FD_LOOKUP]: (
        this: This,
        x: fd,
      ) => FdRec | undefined;
      [wasiP1FsImport.IMPORTS]: Record<PropertyKey, unknown>;
    },
    // biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
    Args extends any[],
    Return,
  >(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ) => {
    const writableTarget = target as Writable<Partial<FsImport<typeof target>>>;
    writableTarget[wasiP1FsImport.RIGHTS] = params.rights;
    writableTarget[wasiP1FsImport.DIR_ONLY] = params.dirOnly === true;
    writableTarget[wasiP1FsImport.FILE_ONLY] = params.fileOnly === true;
    writableTarget[wasiP1FsImport.FD_INDEX] = params.fdIndex;
    assume<FsImport<typeof target>>(target);

    context.addInitializer(function (this: This) {
      assume<{ [wasiP1FsImport.IMPORTS]?: Record<PropertyKey, unknown> }>(this);
      this[wasiP1FsImport.IMPORTS] ??= {};
      this[wasiP1FsImport.IMPORTS][context.name] = wasiP1FsImport.convert(
        target,
        this,
        this[wasiP1FsImport.FD_LOOKUP].bind(this),
      );
    });
  };
}

export namespace wasiP1FsImport {
  export declare const BRAND: unique symbol;
  export const RIGHTS = Symbol("fsExport.RIGHTS");
  export const DIR_ONLY = Symbol("fsExport.DIR_ONLY");
  export const FILE_ONLY = Symbol("fsExport.FILE_ONLY");
  export const FD_INDEX = Symbol("fsExport.FD_INDEX");
  export const IMPORTS = Symbol("fsExport.IMPORTS");
  export const FD_LOOKUP = Symbol("fsExport.FD_LOOKUP");

  export function dirOnly(
    params?: Omit<Parameters<typeof wasiP1FsImport>[0], "dirOnly">,
  ) {
    return wasiP1FsImport({
      ...(params ?? {}),
      dirOnly: true,
    });
  }

  export function fileOnly(
    params?: Omit<Parameters<typeof wasiP1FsImport>[0], "fileOnly">,
  ) {
    return wasiP1FsImport({
      ...(params ?? {}),
      fileOnly: true,
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
  export function is<T extends (...args: any) => void>(x: T): x is FsImport<T> {
    return (
      typeof x === "function" &&
      (RIGHTS in x || DIR_ONLY in x || FILE_ONLY in x)
    );
  }

  export function convert<
    This extends object,
    // biome-ignore lint/suspicious/noExplicitAny: any is correct in generict type constraints
    T extends (this: This, ...args: any) => void,
  >(
    method: FsImport<T>,
    this_: This,
    fdResolver: (x: fd) => FdRec | undefined,
  ) {
    const fdIndex = method[FD_INDEX];
    const rights = method[RIGHTS];
    const dirOnly = method[DIR_ONLY];
    const fileOnly = method[FILE_ONLY];
    return (...args: unknown[]): errno => {
      const fd = args[fdIndex] as fd;
      const fdRec = fdResolver(fd);
      if (fdRec === undefined) return errno.badf;
      fdRec.checkRights(rights);
      if (fileOnly) {
        if (fdRec.isDir()) return errno.isdir;
        if (!fdRec.isFile()) return errno.nodev;
      }
      if (dirOnly && !fdRec.isDir()) return errno.notdir;
      args[fdIndex] = fdRec;
      try {
        method.apply(this_, args);
        return errno.success;
      } catch (e) {
        if (typeof e === "number") return e as errno;
        if (typeof e === "string") return errorCodeToErrno(e as ErrorCode);
        if (
          typeof e === "object" &&
          e !== null &&
          "payload" in e &&
          typeof e.payload === "string"
        )
          return errorCodeToErrno(e.payload as ErrorCode);
        throw e;
      }
    };
  }
}
