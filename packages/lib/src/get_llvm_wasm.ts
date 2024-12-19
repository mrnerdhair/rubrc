import llvm_opt_wasm_br_url from "../data/llvm_opt.wasm?url";
import { get_wasm } from "./get_wasm";

export const get_llvm_wasm = () => get_wasm(llvm_opt_wasm_br_url);
