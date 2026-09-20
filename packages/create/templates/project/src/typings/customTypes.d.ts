// Boundary vocabulary for the relaxed floor, ambient rather than imported, and not emitted under
// `strict`. `declare namespace` carries no runtime code, so it survives `erasableSyntaxOnly`.
declare namespace CustomTypes {
  type JsonValue
    = | string
      | number
      | boolean
      | null
      | JsonObject
      | JsonValue[];

  interface JsonObject {
    [key: string]: JsonValue;
  }

  // `never[]` rather than `unknown[]`, so a caller cannot pass arguments the implementation never accepted.
  type GenericFunction = (...args: never[]) => unknown;
}
