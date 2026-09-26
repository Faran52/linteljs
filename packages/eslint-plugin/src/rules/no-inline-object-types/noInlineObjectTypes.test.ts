import { tsRuleTester } from '@mocks/ruleTesters';

import { noInlineObjectTypes } from './noInlineObjectTypes.ts';

tsRuleTester.run('no-inline-object-types', noInlineObjectTypes, {
  valid: [
    // The named declaration is the thing the rule asks for.
    'type Answers = { target: string };\n',
    'type Answers = {\n  target: string;\n  count: number;\n};\n',
    'interface Answers {\n  target: string;\n}\n',
    // An interface used where a shape is wanted, which is the whole point.
    'interface Answers {\n  target: string;\n}\n'
    + 'export const read = (answers: Answers): string => {\n  return answers.target;\n};\n',
    /**
     * An empty literal is not a shape. `string & {}` keeps a union of string literals open to any other string while
     * an editor still offers the named ones, and there is nothing in it to name.
     */
    'type NamingRule = "kebab" | (string & {});\n',
    'type Empty = {};\n',
    // A mapped type and an index signature are different nodes, and neither is a literal shape to extract.
    'type Flags<T> = { [K in keyof T]: boolean };\n',
    // No type annotation at all, so nothing to name.
    'export const value = { target: "react" };\n',
    // A generic argument that names a type rather than spelling one.
    'type Answers = { target: string };\nexport const all: Array<Answers> = [];\n',
  ],
  invalid: [
    // A parameter annotation, which is where the shape usually hides.
    {
      code: 'export const read = (answers: { target: string }): string => {\n  return answers.target;\n};\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    // A return annotation.
    {
      code: 'export const build = (): { target: string } => {\n  return { target: "react" };\n};\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    // A property inside an interface: named on the outside, unnamed on the inside.
    {
      code: 'interface Manifest {\n  settings?: { id: string };\n}\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    // Nested twice, so both the outer and the inner shape are reported.
    {
      code: 'interface Manifest {\n  settings?: { gecko: { id: string } };\n}\n',
      errors: [{ messageId: 'nameTheType' }, { messageId: 'nameTheType' }],
    },
    // A variable annotation.
    {
      code: 'export const answers: { target: string } = { target: "react" };\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    // Inside a generic argument.
    {
      code: 'export const all: Array<{ target: string }> = [];\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    /**
     * A union arm. The alias names the union, not the shape in it, so each arm is still an anonymous object the rest
     * of the program cannot refer to.
     */
    {
      code: 'type Result = { ok: true } | { ok: false };\n',
      errors: [{ messageId: 'nameTheType' }, { messageId: 'nameTheType' }],
    },
    // An intersection arm carrying members, unlike the empty one the valid list keeps.
    {
      code: 'type Answers = string & { target: string };\n',
      errors: [{ messageId: 'nameTheType' }],
    },
  ],
});

tsRuleTester.run('no-inline-object-types: allowIn', noInlineObjectTypes, {
  valid: [
    // A matcher handed to `Extract`, which reads a shape rather than holding one.
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype OnlyA = Extract<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract'] }],
    },
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype NotA = Exclude<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract', 'Exclude'] }],
    },
  ],
  invalid: [
    // The allowance is per generic: naming one does not cover the other.
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype NotA = Exclude<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    // It reaches the argument, not everything under it: a shape nested inside the argument is still anonymous.
    {
      code: 'type Wrapped = Extract<unknown, { inner: { id: string } }>;\n',
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    // An unconfigured generic is an ordinary type argument.
    {
      code: 'export const all: Array<{ target: string }> = [];\n',
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    /**
     * A call and a `new` carry type arguments too, and the thing holding them is an expression rather than a named
     * type. `allowIn` cannot reach those however it is spelled: naming the callee allows nothing, which is the
     * answer, since the option is about generics that read shapes and a call is not one.
     */
    {
      code: 'export const read = <T,>(value: T): T => {\n  return value;\n};\n'
        + "export const called = read<{ a: string }>({ a: 'x' });\n",
      options: [{ allowIn: ['read'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'export class Made<T> {\n  public constructor(public value: T) {}\n}\n'
        + "export const built = new Made<{ a: string }>({ a: 'x' });\n",
      options: [{ allowIn: ['Made'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    /**
     * A qualified generic carries a `TSQualifiedName`, which has no `name` at all. Answering the string `undefined`
     * for it would have let `allowIn: ['undefined']` switch the rule off by accident, so it answers nothing and the
     * allowance never matches. Naming the right-hand half does not reach it either.
     */
    {
      code: 'declare namespace ns {\n  export type Wrapper<T> = T;\n}\n'
        + 'export type Wrapped = ns.Wrapper<{ a: string }>;\n',
      options: [{ allowIn: ['Wrapper', 'ns', 'undefined'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      // A literal outside any generic names no generic, which an empty entry must not stand in for.
      code: 'export const read = (value: { a: string }): string => value.a;\n',
      options: [{ allowIn: [''] }],
      errors: [{ messageId: 'nameTheType' }],
    },
  ],
});

// The corpus: every position a `TSTypeLiteral` can occupy. A position missing from here is one nobody has decided.
tsRuleTester.run('no-inline-object-types: every position', noInlineObjectTypes, {
  valid: [
    // Nodes that look like a literal and are not one.
    'interface Answers {\n  target: string;\n}\n',
    'type Flags<T> = { [K in keyof T]: boolean };\n',
    'type Keys<T> = keyof T;\n',
    'type Fn = (target: string) => void;\n',
    'type Tuple = [string, number];\n',
    // Every empty literal, wherever it sits: there is nothing in it to name.
    'type Empty = {};\n',
    'type Open = "kebab" | (string & {});\n',
    'export const read = (value: {}): string => {\n  return String(value);\n};\n',
    'export const all: Array<{}> = [];\n',
    // The alias body itself, at every depth of generic nesting on the right of the `=`.
    'type Answers = {\n  target: string;\n};\n',
    'type Readonly2 = {\n  readonly target: string;\n};\n',
    'type Optional = {\n  target?: string;\n};\n',
    'type Method = {\n  read(): string;\n};\n',
    'type Called = {\n  (target: string): void;\n};\n',
  ],
  invalid: [
    // Annotations.
    {
      code: 'export const read = (answers: { target: string }): string => {\n  return answers.target;\n};\n',
      errors: 1,
    },
    {
      code: 'export const build = (): { target: string } => {\n  return { target: "react" };\n};\n',
      errors: 1,
    },
    {
      code: 'export const answers: { target: string } = { target: "react" };\n',
      errors: 1,
    },
    {
      code: 'export const read = (...rest: { target: string }[]): number => {\n  return rest.length;\n};\n',
      errors: 1,
    },
    // Members of a named declaration: the outer name does not reach inside.
    {
      code: 'interface Manifest {\n  settings: { id: string };\n}\n',
      errors: 1,
    },
    {
      code: 'type Manifest = {\n  settings: { id: string };\n};\n',
      errors: 1,
    },
    {
      code: 'interface Manifest {\n  settings?: { gecko: { id: string } };\n}\n',
      errors: 2,
    },
    {
      code: 'interface Manifest {\n  read(): { id: string };\n}\n',
      errors: 1,
    },
    {
      code: 'interface Manifest {\n  read(settings: { id: string }): void;\n}\n',
      errors: 1,
    },
    // Composites.
    {
      code: 'type Result = { ok: true } | { ok: false };\n',
      errors: 2,
    },
    {
      code: 'type Answers = string & { target: string };\n',
      errors: 1,
    },
    {
      code: 'type Many = { target: string }[];\n',
      errors: 1,
    },
    {
      code: 'type Pair = [{ target: string }, number];\n',
      errors: 1,
    },
    // Generic arguments, parameters and constraints.
    {
      code: 'export const all: Array<{ target: string }> = [];\n',
      errors: 1,
    },
    {
      code: 'export const wait = async (): Promise<{ target: string }> => {\n  return { target: "a" };\n};\n',
      errors: 1,
    },
    {
      code: 'export const read = <T extends { target: string }>(value: T): T => {\n  return value;\n};\n',
      errors: 1,
    },
    {
      code: 'export const read = <T = { target: string }>(value: T): T => {\n  return value;\n};\n',
      errors: 1,
    },
    // Function types, at both ends.
    {
      code: 'type Fn = (answers: { target: string }) => void;\n',
      errors: 1,
    },
    {
      code: 'type Fn = () => { target: string };\n',
      errors: 1,
    },
    // A type predicate names a shape the caller then cannot name.
    {
      code: 'export const isAnswers = (value: string): value is unknown & { target: string } => {\n'
        + '  return Boolean(value);\n};\n',
      errors: 1,
    },
    // Classes.
    {
      code: 'export class Target {\n  public settings: { id: string } = { id: "a" };\n}\n',
      errors: 1,
    },
    {
      code: 'export class Target {\n  public read(settings: { id: string }): void {\n    void settings;\n  }\n}\n',
      errors: 1,
    },
    // An index signature is a member like any other, so the literal holding it is still a shape.
    {
      code: 'type Bag = {\n  nested: { [key: string]: string };\n};\n',
      errors: 1,
    },
  ],
});

/**
 * The rest of the grammar, found by parsing a probe file. The `export` and parenthesised forms are valid because the
 * parser hands the literal straight to the alias in both: a fact about the parser that an upgrade could take away.
 */
tsRuleTester.run('no-inline-object-types: the rest of the grammar', noInlineObjectTypes, {
  valid: [
    'export type Answers = { target: string };\n',
    // Parentheses leave no node behind, so the literal is still the alias body.
    'export type Answers = ({ target: string });\n',
  ],
  invalid: [
    // A conditional type holds three of them, and names none.
    {
      code: 'export type Pick2<T> = T extends { a: string } ? { b: string } : { c: string };\n',
      errors: 3,
    },
    // The mapped type is not a literal; the value it maps to is.
    {
      code: 'export type Values<T> = { [K in keyof T]: { a: string } };\n',
      errors: 1,
    },
    {
      code: "export type Indexed = { a: string }['a'];\n",
      errors: 1,
    },
    {
      code: 'export type Keys = keyof { a: string };\n',
      errors: 1,
    },
    {
      code: 'export type Ctor = new (value: { a: string }) => void;\n',
      errors: 1,
    },
    // Tuples, in all three spellings.
    {
      code: 'export type Named = [first: { a: string }];\n',
      errors: 1,
    },
    {
      code: 'export type Optional2 = [{ a: string }?];\n',
      errors: 1,
    },
    {
      code: 'export type Frozen = readonly { a: string }[];\n',
      errors: 1,
    },
    // Inside a literal that is itself the alias body, so only the inner one is anonymous.
    {
      code: 'export type Bag = { [key: string]: { a: string } };\n',
      errors: 1,
    },
    {
      code: 'export type Ctors = { new (value: { a: string }): void };\n',
      errors: 1,
    },
    {
      code: 'export type Calls = { (value: { a: string }): void };\n',
      errors: 1,
    },
    {
      code: 'export type Getters = { get value(): { a: string } };\n',
      errors: 1,
    },
    // A utility type is an ordinary generic unless `allowIn` says otherwise.
    {
      code: 'export type Frozen2 = Readonly<{ a: string }>;\n',
      errors: 1,
    },
    // A declared function, which this repo does not write but the rule still has to see.
    {
      code: 'export function read(value: { a: string }): { b: string } {\n  return { b: value.a };\n}\n',
      errors: 2,
    },
    {
      code: 'export const read = (value?: { a: string }): number => {\n  return value ? 1 : 0;\n};\n',
      errors: 1,
    },
    {
      code: 'export const check = (value: unknown): asserts value is unknown & { a: string } => {\n  void value;\n};\n',
      errors: 1,
    },
    // A destructured parameter still annotates a shape, and that shape still has no name.
    {
      code: 'export const read = ({ a }: { a: string }): string => {\n  return a;\n};\n',
      errors: 1,
    },
    // Class members, including the accessor pair.
    {
      code: "export class Target {\n  public static shared: { a: string } = { a: 'x' };\n}\n",
      errors: 1,
    },
    {
      code: "export class Target {\n  public get value(): { a: string } {\n    return { a: 'x' };\n  }\n}\n",
      errors: 1,
    },
    {
      code: 'export class Target {\n  public set value(next: { a: string }) {\n    void next;\n  }\n}\n',
      errors: 1,
    },
    // The two expression-level type positions. `as` is banned by this repo's own standard and is still the rule's
    // business, because the plugin is published to people whose standard is their own.
    {
      code: "export const value = { a: 'x' } satisfies { a: string };\n",
      errors: 1,
    },
    {
      code: "export const value = { a: 'x' } as { a: string };\n",
      errors: 1,
    },
    // A constraint on a class, which is the same node as one on a function and a different place to miss it.
    {
      code: 'export class Holder<T extends { a: string }> {\n  public value?: T;\n}\n',
      errors: 1,
    },
    // Inside an ambient module, where the declarations start again one level down.
    {
      code: "declare module 'virtual' {\n  export const inside: { a: string };\n}\n",
      errors: 1,
    },
    {
      code: 'export type Ctor = abstract new (value: { a: string }) => void;\n',
      errors: 1,
    },
  ],
});
