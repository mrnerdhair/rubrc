import { type CallerTarget, new_caller_target } from "./caller";
import type { ListenerTarget } from "./listener";

export { Locker, type LockerTarget, new_locker_target } from "./locker";
export { Caller, type CallerTarget } from "./caller";
export { Listener, type ListenerTarget } from "./listener";

export function new_caller_listener_target(): [CallerTarget, ListenerTarget] {
  const caller_target = new_caller_target();
  return [caller_target, caller_target as unknown as ListenerTarget];
}
