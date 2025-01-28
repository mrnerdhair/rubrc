export function autoincrement<This, T extends number | bigint>(
  validator?: (x: T) => T,
) {
  return (
    value: ClassAccessorDecoratorTarget<This, T>,
    _context: ClassAccessorDecoratorContext<This, T>,
  ): ClassAccessorDecoratorResult<This, T> => {
    return {
      get() {
        let current = value.get.call(this);
        const out = current++ as T;
        value.set.call(this, (validator ?? ((x) => x))(current));
        return out;
      },
    };
  };
}
