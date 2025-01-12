import {
  type Target as CallerTarget,
  new_target as new_caller_target,
} from "./caller";
import type { Target as ListenerTarget } from "./listener";

export {
  Locker,
  type Target as LockerTarget,
  new_locker_target,
} from "./locker";
export { Caller, type Target as CallerTarget } from "./caller";
export { Listener, type Target as ListenerTarget } from "./listener";
export { LockNotReady } from "./locking_base";
export { PromiseLocker } from "./promise_locker";
export { ViewSet } from "./view_set";

export {
  Waitable,
  WaitOnGen,
  Wait,
  Spin,
} from "./waiter";
export type { Waited, WaitOnGenBase } from "./waiter";

export function new_caller_listener_target(
  size = 0,
): [CallerTarget, ListenerTarget] {
  const caller_target = new_caller_target(size);
  return [caller_target, caller_target as unknown as ListenerTarget];
}
