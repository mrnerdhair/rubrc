import { describe, expect, it } from "vitest";
import { autoincrement } from "./autoincrement";

describe("autoincrement", () => {
  it("works on numbers without a validator", () => {
    class Foo {
      @autoincrement()
      accessor foobar = 123;
    }

    const foo = new Foo();

    expect(foo.foobar).toStrictEqual(123);
    expect(foo.foobar).toStrictEqual(124);
    expect(foo.foobar).toStrictEqual(125);
  });
  it("works on bigints without a validator", () => {
    class Foo {
      @autoincrement()
      accessor foobar = 123n;
    }

    const foo = new Foo();

    expect(foo.foobar).toStrictEqual(123n);
    expect(foo.foobar).toStrictEqual(124n);
    expect(foo.foobar).toStrictEqual(125n);
  });

  it("works on numbers with a validator", () => {
    class Foo {
      @autoincrement((x) => {
        if (x > 125) throw "whoops";
        return x;
      })
      accessor foobar = 123;
    }

    const foo = new Foo();

    expect(foo.foobar).toStrictEqual(123);
    expect(foo.foobar).toStrictEqual(124);
    expect(() => {
      foo.foobar;
    }).toThrowError("whoops");
  });

  it("works on bigints with a validator", () => {
    class Foo {
      @autoincrement((x) => {
        if (x > 125n) throw "whoops";
        return x;
      })
      accessor foobar = 123n;
    }

    const foo = new Foo();

    expect(foo.foobar).toStrictEqual(123n);
    expect(foo.foobar).toStrictEqual(124n);
    expect(() => {
      foo.foobar;
    }).toThrowError("whoops");
  });
});
