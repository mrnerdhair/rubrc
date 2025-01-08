import {
  type AsyncCallerTarget,
  new_async_caller_target,
} from "./async_caller";
import { type CallerTarget, new_caller_target } from "./caller";
import type { ListenerTarget } from "./listener";

export {
  Locker,
  type LockerTarget,
  new_locker_target,
  LockNotReady,
} from "./locker";
export { Caller, type CallerTarget, NoListener } from "./caller";
export { Listener, type ListenerTarget } from "./listener";
export {
  AsyncCaller,
  type AsyncCallerTarget,
} from "./async_caller";
export { PromiseLocker } from "./promise_locker";
export {
  DummyCaller1,
  DummyCaller2,
  DummyCaller3,
  DummyCaller4,
  DummyCaller5,
  DummyListener1,
  DummyListener2,
  DummyListener3,
  DummyListener4,
} from "./dummies";

export function new_caller_listener_target(): [CallerTarget, ListenerTarget] {
  const caller_target = new_caller_target();
  return [caller_target, caller_target as unknown as ListenerTarget];
}

export function new_async_caller_listener_target(): [
  AsyncCallerTarget,
  ListenerTarget,
] {
  const caller_target = new_async_caller_target();
  return [caller_target, caller_target as unknown as ListenerTarget];
}
