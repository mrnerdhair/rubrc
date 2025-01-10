import { thread_spawn_on_worker } from "../thread_spawn";

self.onmessage = async (event) => {
  await thread_spawn_on_worker(event.data);
};
