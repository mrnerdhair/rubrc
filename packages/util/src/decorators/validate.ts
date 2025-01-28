export function readonly<T>(error: unknown | ((x: T) => unknown)) {
  return validate((x: T) => {
    throw typeof error === "function" ? error(x) : error;
  });
}

export function validate<This, T>(validator: (this: This, x: T) => void) {
  return (
    value: ClassAccessorDecoratorTarget<This, T>,
    _context: ClassAccessorDecoratorContext<This, T>,
  ): ClassAccessorDecoratorResult<This, T> => {
    return {
      get() {
        return value.get.call(this);
      },
      set(x: T) {
        validator.call(this, x);
        value.set.call(this, x);
      },
    };
  };
}
