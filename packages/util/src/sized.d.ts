declare const sized: unique symbol;
export interface Sized {
  readonly [sized]: never;
}

declare const zeroSized: unique symbol;
export interface ZeroSized extends Sized {
  readonly [zeroSized]: never;
}
