import rustc_opt_wasm_url from "../data/rustc_opt.wasm.br.dummyext?url";
import { get_wasm } from "./get_wasm";

export const get_rustc_wasm = () => get_wasm(rustc_opt_wasm_url);
