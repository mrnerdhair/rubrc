import { WASIFarmAnimal } from "../../animals";
import { ThreadSpawner, type ThreadSpawnerObject } from "../thread_spawn";
import type { WorkerBackgroundRefObject } from "./worker_export";

// send fd_map is not implemented yet.
// issue: the fd passed to the child process is different from the parent process.
const thread_spawn_on_worker = async (
  msg: {
    this_is_thread_spawn: true;
    worker_background_ref: WorkerBackgroundRefObject;
    sl_object: ThreadSpawnerObject;
    thread_spawn_wasm: WebAssembly.Module;
    args: Array<string>;
    env: Array<string>;
    fd_map: [number, number][];
  } & (
    | {
        this_is_start: never;
      }
    | {
        this_is_start: true;
        worker_id: number;
        start_arg: number;
      }
  ),
): Promise<void> => {
  const {
    sl_object,
    fd_map,
    worker_background_ref,
    thread_spawn_wasm,
    args,
    env,
  } = msg;

  const override_fd_map: Array<number[]> = new Array(
    sl_object.wasi_farm_refs_object.length,
  );

  // Possibly null (undefined)
  for (const fd_and_wasi_ref_n of fd_map) {
    if ((fd_and_wasi_ref_n ?? undefined) !== undefined) {
      const [fd, wasi_ref_n] = fd_and_wasi_ref_n;
      if (override_fd_map[wasi_ref_n] === undefined) {
        override_fd_map[wasi_ref_n] = [];
      }
      override_fd_map[wasi_ref_n].push(fd);
    }
  }

  const thread_spawner = await ThreadSpawner.init({
    ...sl_object,
    worker_background_ref_object: worker_background_ref,
  });

  const wasi = await WASIFarmAnimal.init(
    sl_object.wasi_farm_refs_object,
    args,
    env,
    {
      can_thread_spawn: true,
      hand_override_fd_map: fd_map,
    },
    override_fd_map,
    thread_spawner,
  );

  if (msg.this_is_start) {
    const inst = await wasi.instantiate_cmd(thread_spawn_wasm);

    try {
      globalThis.postMessage({
        msg: "done",
        code: await wasi.start(inst),
      });
    } catch (e) {
      globalThis.postMessage({
        msg: "error",
        error: e,
      });
    }
  } else {
    const { worker_id: thread_id, start_arg } = msg;

    console.log(`thread_spawn worker ${thread_id} start`);

    const inst = await wasi.instantiate_thread(thread_spawn_wasm);

    globalThis.postMessage({
      msg: "ready",
    });

    try {
      globalThis.postMessage({
        msg: "done",
        code: await wasi.wasi_thread_start(inst, thread_id, start_arg),
      });
    } catch (e) {
      globalThis.postMessage({
        msg: "error",
        error: e,
      });
    }
  }
};

self.onmessage = async (event) => {
  await thread_spawn_on_worker(event.data);
};
