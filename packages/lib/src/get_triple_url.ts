import aarch64_apple_darwin_url from "../data/sysroots/aarch64-apple-darwin.tar.br?url";
import aarch64_pc_windows_msvc_url from "../data/sysroots/aarch64-pc-windows-msvc.tar.br?url";
import aarch64_unknown_linux_gnu_url from "../data/sysroots/aarch64-unknown-linux-gnu.tar.br?url";
import aarch64_unknown_linux_musl_url from "../data/sysroots/aarch64-unknown-linux-musl.tar.br?url";
import arm_unknown_linux_gnueabi_url from "../data/sysroots/arm-unknown-linux-gnueabi.tar.br?url";
import arm_unknown_linux_gnueabihf_url from "../data/sysroots/arm-unknown-linux-gnueabihf.tar.br?url";
import arm_unknown_linux_musleabi_url from "../data/sysroots/arm-unknown-linux-musleabi.tar.br?url";
import arm_unknown_linux_musleabihf_url from "../data/sysroots/arm-unknown-linux-musleabihf.tar.br?url";
import armv7_unknown_linux_gnueabihf_url from "../data/sysroots/armv7-unknown-linux-gnueabihf.tar.br?url";
import i586_unknown_linux_gnu_url from "../data/sysroots/i586-unknown-linux-gnu.tar.br?url";
import i686_pc_windows_gnu_url from "../data/sysroots/i686-pc-windows-gnu.tar.br?url";
import i686_pc_windows_msvc_url from "../data/sysroots/i686-pc-windows-msvc.tar.br?url";
import i686_unknown_linux_gnu_url from "../data/sysroots/i686-unknown-linux-gnu.tar.br?url";
import i686_unknown_linux_musl_url from "../data/sysroots/i686-unknown-linux-musl.tar.br?url";
import loongarch64_unknown_linux_gnu_url from "../data/sysroots/loongarch64-unknown-linux-gnu.tar.br?url";
import loongarch64_unknown_linux_musl_url from "../data/sysroots/loongarch64-unknown-linux-musl.tar.br?url";
import powerpc_unknown_linux_gnu_url from "../data/sysroots/powerpc-unknown-linux-gnu.tar.br?url";
import powerpc64_unknown_linux_gnu_url from "../data/sysroots/powerpc64-unknown-linux-gnu.tar.br?url";
import powerpc64le_unknown_linux_gnu_url from "../data/sysroots/powerpc64le-unknown-linux-gnu.tar.br?url";
import riscv64gc_unknown_linux_gnu_url from "../data/sysroots/riscv64gc-unknown-linux-gnu.tar.br?url";
import riscv64gc_unknown_linux_musl_url from "../data/sysroots/riscv64gc-unknown-linux-musl.tar.br?url";
import s390x_unknown_linux_gnu_url from "../data/sysroots/s390x-unknown-linux-gnu.tar.br?url";
import sparcv9_sun_solaris_url from "../data/sysroots/sparcv9-sun-solaris.tar.br?url";
import wasm32_unknown_emscripten_url from "../data/sysroots/wasm32-unknown-emscripten.tar.br?url";
import wasm32_unknown_unknown_url from "../data/sysroots/wasm32-unknown-unknown.tar.br?url";
import wasm32_wasip1_threads_url from "../data/sysroots/wasm32-wasip1-threads.tar.br?url";
import wasm32_wasip1_url from "../data/sysroots/wasm32-wasip1.tar?url";
import x86_64_apple_darwin_url from "../data/sysroots/x86_64-apple-darwin.tar.br?url";
import x86_64_pc_windows_gnu_url from "../data/sysroots/x86_64-pc-windows-gnu.tar.br?url";
import x86_64_pc_windows_msvc_url from "../data/sysroots/x86_64-pc-windows-msvc.tar.br?url";
import x86_64_unknown_freebsd_url from "../data/sysroots/x86_64-unknown-freebsd.tar.br?url";
import x86_64_unknown_illumos_url from "../data/sysroots/x86_64-unknown-illumos.tar.br?url";
import x86_64_unknown_linux_gnu_url from "../data/sysroots/x86_64-unknown-linux-gnu.tar.br?url";
import x86_64_unknown_linux_musl_url from "../data/sysroots/x86_64-unknown-linux-musl.tar.br?url";
import x86_64_unknown_netbsd_url from "../data/sysroots/x86_64-unknown-netbsd.tar.br?url";

export function getTripleUrl(triple: string): string {
  switch (triple) {
    case "aarch64-unknown-linux-gnu":
      return aarch64_unknown_linux_gnu_url;
    case "aarch64-unknown-linux-musl":
      return aarch64_unknown_linux_musl_url;
    case "arm-unknown-linux-gnueabi":
      return arm_unknown_linux_gnueabi_url;
    case "arm-unknown-linux-gnueabihf":
      return arm_unknown_linux_gnueabihf_url;
    case "arm-unknown-linux-musleabi":
      return arm_unknown_linux_musleabi_url;
    case "arm-unknown-linux-musleabihf":
      return arm_unknown_linux_musleabihf_url;
    case "armv7-unknown-linux-gnueabihf":
      return armv7_unknown_linux_gnueabihf_url;
    case "i586-unknown-linux-gnu":
      return i586_unknown_linux_gnu_url;
    case "i686-unknown-linux-gnu":
      return i686_unknown_linux_gnu_url;
    case "i686-unknown-linux-musl":
      return i686_unknown_linux_musl_url;
    case "loongarch64-unknown-linux-gnu":
      return loongarch64_unknown_linux_gnu_url;
    case "loongarch64-unknown-linux-musl":
      return loongarch64_unknown_linux_musl_url;
    case "powerpc-unknown-linux-gnu":
      return powerpc_unknown_linux_gnu_url;
    case "powerpc64-unknown-linux-gnu":
      return powerpc64_unknown_linux_gnu_url;
    case "powerpc64le-unknown-linux-gnu":
      return powerpc64le_unknown_linux_gnu_url;
    case "riscv64gc-unknown-linux-gnu":
      return riscv64gc_unknown_linux_gnu_url;
    case "riscv64gc-unknown-linux-musl":
      return riscv64gc_unknown_linux_musl_url;
    case "s390x-unknown-linux-gnu":
      return s390x_unknown_linux_gnu_url;
    case "sparcv9-sun-solaris":
      return sparcv9_sun_solaris_url;
    case "wasm32-unknown-emscripten":
      return wasm32_unknown_emscripten_url;
    case "wasm32-unknown-unknown":
      return wasm32_unknown_unknown_url;
    case "wasm32-wasip1-threads":
      return wasm32_wasip1_threads_url;
    case "wasm32-wasip1":
      return wasm32_wasip1_url;
    case "x86_64-pc-windows-gnu":
      return x86_64_pc_windows_gnu_url;
    case "x86_64-unknown-freebsd":
      return x86_64_unknown_freebsd_url;
    case "x86_64-unknown-illumos":
      return x86_64_unknown_illumos_url;
    case "x86_64-unknown-linux-gnu":
      return x86_64_unknown_linux_gnu_url;
    case "x86_64-unknown-linux-musl":
      return x86_64_unknown_linux_musl_url;
    case "x86_64-unknown-netbsd":
      return x86_64_unknown_netbsd_url;
    case "aarch64-pc-windows-msvc":
      return aarch64_pc_windows_msvc_url;
    case "i686-pc-windows-gnu":
      return i686_pc_windows_gnu_url;
    case "i686-pc-windows-msvc":
      return i686_pc_windows_msvc_url;
    case "x86_64-pc-windows-msvc":
      return x86_64_pc_windows_msvc_url;
    case "aarch64-apple-darwin":
      return aarch64_apple_darwin_url;
    case "x86_64-apple-darwin":
      return x86_64_apple_darwin_url;
    default:
      throw new Error(`no sysroot for target triple ${triple}`);
  }
}
