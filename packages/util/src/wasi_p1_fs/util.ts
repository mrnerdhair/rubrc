export function hasFlag(x: number, flag: number): boolean;
export function hasFlag(x: bigint, flag: bigint): boolean;
export function hasFlag(
  ...args: [x: number, flag: number] | [x: bigint, flag: bigint]
): boolean {
  const [x, flag] = args;
  return BigInt(flag) === 0n || (BigInt(x) & BigInt(flag)) !== 0n;
}
