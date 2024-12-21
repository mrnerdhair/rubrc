import type { Fd } from "@bjorn3/browser_wasi_shim";
import type { WASIFarmPark } from "./park";
import {
  WASIFarmParkUseArrayBuffer,
  type WASIFarmRefUseArrayBufferObject,
} from "./shared_array_buffer/index";

export class WASIFarm {
  private fds: Array<Fd>;
  private park: WASIFarmPark;

  private can_array_buffer: boolean;

  constructor(
    stdin?: Fd,
    stdout?: Fd,
    stderr?: Fd,
    fds: Array<Fd> = [],
    options: {
      allocator_size?: number;
    } = {},
  ) {
    const new_fds = [];
    let stdin_ = undefined;
    let stdout_ = undefined;
    let stderr_ = undefined;
    if (stdin) {
      new_fds.push(stdin);
      stdin_ = new_fds.length - 1;
    }
    if (stdout) {
      new_fds.push(stdout);
      stdout_ = new_fds.length - 1;
    }
    if (stderr) {
      new_fds.push(stderr);
      stderr_ = new_fds.length - 1;
    }
    new_fds.push(...fds);

    const default_allow_fds = [];
    for (let i = 0; i < new_fds.length; i++) {
      default_allow_fds.push(i);
    }

    this.fds = new_fds;

    // WebAssembly.Memory can be used to create a SharedArrayBuffer, but it cannot be transferred by postMessage.
    // Uncaught (in promise) DataCloneError:
    //    Failed to execute 'postMessage' on 'Worker':
    //    SharedArrayBuffer transfer requires self.crossOriginIsolated.
    try {
      new SharedArrayBuffer(4);
      this.can_array_buffer = true;
    } catch (e) {
      this.can_array_buffer = false;
      console.warn("SharedArrayBuffer is not supported:", e);

      if (!globalThis.crossOriginIsolated) {
        console.warn(
          "SharedArrayBuffer is not supported because crossOriginIsolated is not enabled.",
        );
      }
    }

    if (!this.can_array_buffer) {
      throw new Error("Non SharedArrayBuffer is not supported yet");
    }

    this.park = new WASIFarmParkUseArrayBuffer(
      this.fds,
      stdin_,
      stdout_,
      stderr_,
      default_allow_fds,
      options?.allocator_size,
    );
    this.park.listen();
  }

  get_ref(): WASIFarmRefUseArrayBufferObject {
    return this.park.get_ref();
  }
}
