export type Lazy<T> = T & { readonly [lazy.BRAND]: never };

export function lazy<This, T>(
  value: ClassAccessorDecoratorTarget<This, T>,
  context: ClassAccessorDecoratorContext<This, T>,
): ClassAccessorDecoratorResult<This, T>;
export function lazy<T>(x: () => T): Lazy<T>;
export function lazy<This, T>(
  ...args:
    | [x: () => T]
    | [
        value: ClassAccessorDecoratorTarget<This, T>,
        context: ClassAccessorDecoratorContext<This, T>,
      ]
): Lazy<T> | ClassAccessorDecoratorResult<This, T> {
  if (args.length <= 1 || typeof args[1] !== "object" || args[1] === null) {
    const [x] = args as [x: () => T];
    return x as Lazy<T>;
  }

  const [value, _context] = args as [
    value: ClassAccessorDecoratorTarget<This, T>,
    context: ClassAccessorDecoratorContext<This, T>,
  ];
  let initializer: ((this: This) => T) | undefined = undefined;
  return {
    get() {
      let out = value.get.call(this);
      if ((out as unknown) === lazy.UNINIT) {
        if (initializer === undefined)
          throw new Error("lazy value accessed before initializer set");
        out = initializer.call(this);
        value.set.call(this, out);
      }
      return out;
    },
    set(x: T) {
      if (initializer === undefined) {
        initializer = x as unknown as (this: This) => T;
      } else {
        value.set.call(this, x);
      }
    },
    init(x: T) {
      initializer = x as unknown as (this: This) => T;
      return lazy.UNINIT as unknown as T;
    },
  };
}

export namespace lazy {
  export declare const BRAND: unique symbol;
  export const UNINIT = Symbol("lazy.UNINIT");
}
