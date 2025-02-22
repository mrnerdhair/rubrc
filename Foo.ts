get
setpackages/lib/dist
apply
construct
ownKeys
getPrototypeOf



find all own keys with values which are promises
find all own keys with primitive-ish values
find all own keys with values which are functions
find all own keys with values which are not 

get all properites with getters and turn them into promise getters
get all properties with setters and make them take promises too

class Foo<T extends Record<PropertyKey, unknown>> implements ProxyHandler<T> {
  apply(target: T, thisArg: unknown, argArray: unknown[]) {
    
  }
  construct(target: T, argArray: unknown[], newTarget: Function): object {
    
  }
  defineProperty(target: T, property: string | symbol, attributes: PropertyDescriptor): boolean {
    
  }
  deleteProperty(target: T, p: string | symbol): boolean {
    
  }
  get(target: T, p: string | symbol, receiver: unknown) {
    
  }
  getOwnPropertyDescriptor(target: T, p: string | symbol): PropertyDescriptor | undefined {
    
  }
  getPrototypeOf(target: T): object | null {
    
  }
  has(target: T, p: string | symbol): boolean {
    
  }
  isExtensible(target: T): boolean {
    
  }
  ownKeys(target: T): ArrayLike<string | symbol> {
    
  }
  preventExtensions(target: T): boolean {
    
  }
  set(target: T, p: string | symbol, newValue: unknown, receiver: unknown): boolean {

  }
  setPrototypeOf(target: T, v: object | null): boolean {
    
  }
}
