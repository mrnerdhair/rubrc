import llvm_opt_wasm_url from "../data/llvm_opt.wasm.br.dummyext?url";
import { get_wasm } from "./get_wasm";

export const get_llvm_wasm = () => get_wasm(llvm_opt_wasm_url);
