// `declare namespace` carries no runtime code, so it survives `erasableSyntaxOnly`.
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
