import { describe, expect, it, vi } from "vitest";
import { lazy } from "./lazy";

describe("lazy", () => {
  it("works", () => {
    const fn = vi.fn(() => {
      return 123;
    });

    class Foo {
      @lazy
      accessor foobar = lazy(fn);
    }

    const foo = new Foo();

    expect(fn).not.toHaveBeenCalled();
    expect(foo.foobar).toStrictEqual(123);
    expect(fn).toHaveBeenCalled();
  });
});
