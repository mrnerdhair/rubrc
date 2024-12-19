# SharedObject
Enables object functions to be called from multiple workers on the Web

Some of the functions listed here can be used, although they are still under construction.
Currently, when async or await is called, it does not wait.

example:

```typescript:main.ts
import { SharedObject } from "../lib";
import { SharedObjectRef } from '../lib/ref';

const object = [{
  add(a: number, b: number) {
    return a + b;
  }
}];

const sharedObject = new SharedObject(object, "abcd");

const sharedObject2 = new SharedObject((a, b) => a * b, "tyu");

const w = new Worker(new URL("../src-dist/worker.js", import.meta.url).href, { type: "module" });
```

```typescript:worker.ts
import { SharedObjectRef } from "../lib/ref";

const sharedObjectRef = new SharedObjectRef("abcd");

const proxy = sharedObjectRef.proxy<[{ add(a: number, b: number): Promise<number> }]>();

const ret2 = await proxy[0].add(1, 2);

console.log(ret2);

const sharedObjectRef2 = new SharedObjectRef("tyu");

const proxy2 = sharedObjectRef2.proxy<(a: number, b: number) => number>();

console.log(await proxy2(6, 9));
```
> !warning
> "These can also be shared between tabs. Please be aware."
