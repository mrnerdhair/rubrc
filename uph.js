class Foo extends Promise {
  constructor(...args) {
    console.log("constructor start", args);
    super(...args);
    console.log("constructor end", this);
  }
  then(...args) {
    console.log("then start", args);
    const out = super.then(...args);
    console.log("then end", out);
    return out;
  }
  static get [Symbol.species]() {
    console.log("species");
    return Foo;
  }
}

console.log("start");
foo = new Foo(x => resolve = x);
console.log("foo", foo);
bar = Promise.resolve(foo);
console.log("bar", bar);
console.log("end");


const uph = (pseudoTarget) =>
  new Proxy(
    {},
    {
      get(_, p) {
        return (_t, p2, r) => {
          console.log("uph", p, p2, r);
          switch (p) {
            case "get": {
              const out = Reflect.get(pseudoTarget, p2, r);
              if (typeof out === "function") return out.bind(pseudoTarget);
              return out;
            }
            case "getOwnPropertyDescriptor": {
              const out = Reflect.getOwnPropertyDescriptor(pseudoTarget, p2);
              if (out) out.configurable = true;
              return out;
            }
            case "isExtensible":
              return true;
            case "preventExtensions":
              return false;
            default:
              return Reflect[p](pseudoTarget, p2, r);
          }
        };
      },
    }
  );