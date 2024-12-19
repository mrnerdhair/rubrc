import { get_wasm } from "./get_wasm";
import rustc_opt_wasm_br_url from "../data/rustc_opt.wasm?url";

export const get_rustc_wasm = () => get_wasm(rustc_opt_wasm_br_url);
