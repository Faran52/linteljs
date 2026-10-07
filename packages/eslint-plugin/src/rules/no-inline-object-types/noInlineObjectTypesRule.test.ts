import { tsRuleTester } from '@mocks/ruleTesters';

import { noInlineObjectTypes } from './noInlineObjectTypesRule.ts';

tsRuleTester.run('no-inline-object-types', noInlineObjectTypes, {
  valid: [
    'type Answers = { target: string };\n',
    'type Answers = {\n  target: string;\n  count: number;\n};\n',
    'interface Answers {\n  target: string;\n}\n',
    'interface Answers {\n  target: string;\n}\n'
    + 'export const read = (answers: Answers): string => {\n  return answers.target;\n};\n',
    'type NamingRule = "kebab" | (string & {});\n',
    'type Empty = {};\n',
    'type Flags<T> = { [K in keyof T]: boolean };\n',
    'export const value = { target: "react" };\n',
    'type Answers = { target: string };\nexport const all: Array<Answers> = [];\n',
  ],
  invalid: [
    {
      code: 'export const read = (answers: { target: string }): string => {\n  return answers.target;\n};\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'export const build = (): { target: string } => {\n  return { target: "react" };\n};\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'interface Manifest {\n  settings?: { id: string };\n}\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'interface Manifest {\n  settings?: { gecko: { id: string } };\n}\n',
      errors: [{ messageId: 'nameTheType' }, { messageId: 'nameTheType' }],
    },
    {
      code: 'export const answers: { target: string } = { target: "react" };\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'export const all: Array<{ target: string }> = [];\n',
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'type Result = { ok: true } | { ok: false };\n',
      errors: [{ messageId: 'nameTheType' }, { messageId: 'nameTheType' }],
    },
    {
      code: 'type Answers = string & { target: string };\n',
      errors: [{ messageId: 'nameTheType' }],
    },
  ],
});

tsRuleTester.run('no-inline-object-types: allowIn', noInlineObjectTypes, {
  valid: [
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype OnlyA = Extract<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract'] }],
    },
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype NotA = Exclude<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract', 'Exclude'] }],
    },
    {
      code: 'type Props = React.PropsWithChildren<{ a: string }>;\n',
      options: [{ allowIn: ['PropsWithChildren'] }],
    },
    {
      code: 'declare namespace a.b {\n  export type Wrapper<T> = T;\n}\n'
        + 'export type Wrapped = a.b.Wrapper<{ c: string }>;\n',
      options: [{ allowIn: ['Wrapper'] }],
    },
    {
      code: "type Picked = Extract<unknown, { a: 'x' }>;\ntype Again = Extract<Picked, { b: 'y' }>;\n",
      options: [{ allowIn: ['Extract'] }],
    },
  ],
  invalid: [
    {
      code: 'type Props = React.PropsWithChildren<{ a: string }>;\n',
      options: [{ allowIn: ['React'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: "interface NodeA {\n  type: 'A';\n}\ntype NotA = Exclude<NodeA, { type: 'A' }>;\n",
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'type Wrapped = Extract<unknown, { inner: { id: string } }>;\n',
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      // The union is the argument, so its members are not.
      code: "type Either = Extract<unknown, { a: 'x' } | { b: 'y' }>;\n",
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }, { messageId: 'nameTheType' }],
    },
    {
      code: 'export const all: Array<{ target: string }> = [];\n',
      options: [{ allowIn: ['Extract'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
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
    {
      code: 'declare namespace ns {\n  export type Wrapper<T> = T;\n}\n'
        + 'export type Wrapped = ns.Wrapper<{ a: string }>;\n',
      options: [{ allowIn: ['ns', 'undefined'] }],
      errors: [{ messageId: 'nameTheType' }],
    },
    {
      code: 'export const read = (value: { a: string }): string => value.a;\n',
      options: [{ allowIn: [''] }],
      errors: [{ messageId: 'nameTheType' }],
    },
  ],
});

tsRuleTester.run('no-inline-object-types: every position', noInlineObjectTypes, {
  valid: [
    'interface Answers {\n  target: string;\n}\n',
    'type Flags<T> = { [K in keyof T]: boolean };\n',
    'type Keys<T> = keyof T;\n',
    'type Fn = (target: string) => void;\n',
    'type Tuple = [string, number];\n',
    'type Empty = {};\n',
    'type Open = "kebab" | (string & {});\n',
    'export const read = (value: {}): string => {\n  return String(value);\n};\n',
    'export const all: Array<{}> = [];\n',
    'type Answers = {\n  target: string;\n};\n',
    'type Readonly2 = {\n  readonly target: string;\n};\n',
    'type Optional = {\n  target?: string;\n};\n',
    'type Method = {\n  read(): string;\n};\n',
    'type Called = {\n  (target: string): void;\n};\n',
  ],
  invalid: [
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
    {
      code: 'type Fn = (answers: { target: string }) => void;\n',
      errors: 1,
    },
    {
      code: 'type Fn = () => { target: string };\n',
      errors: 1,
    },
    {
      code: 'export const isAnswers = (value: string): value is unknown & { target: string } => {\n'
        + '  return Boolean(value);\n};\n',
      errors: 1,
    },
    {
      code: 'export class Target {\n  public settings: { id: string } = { id: "a" };\n}\n',
      errors: 1,
    },
    {
      code: 'export class Target {\n  public read(settings: { id: string }): void {\n    void settings;\n  }\n}\n',
      errors: 1,
    },
    {
      code: 'type Bag = {\n  nested: { [key: string]: string };\n};\n',
      errors: 1,
    },
  ],
});

tsRuleTester.run('no-inline-object-types: the rest of the grammar', noInlineObjectTypes, {
  valid: [
    'export type Answers = { target: string };\n',
    'export type Answers = ({ target: string });\n',
    'export type Box<T> = { value: T };\n',
    'export const read = (value: { /* nothing yet */ }): string => {\n  return String(value);\n};\n',
  ],
  invalid: [
    {
      code: 'export type Pick2<T> = T extends { a: string } ? { b: string } : { c: string };\n',
      errors: 3,
    },
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
    {
      code: 'export type Frozen2 = Readonly<{ a: string }>;\n',
      errors: 1,
    },
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
    {
      code: 'export const read = ({ a }: { a: string }): string => {\n  return a;\n};\n',
      errors: 1,
    },
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
    {
      code: "export const value = { a: 'x' } satisfies { a: string };\n",
      errors: 1,
    },
    {
      code: "export const value = { a: 'x' } as { a: string };\n",
      errors: 1,
    },
    {
      code: 'export class Holder<T extends { a: string }> {\n  public value?: T;\n}\n',
      errors: 1,
    },
    {
      code: "declare module 'virtual' {\n  export const inside: { a: string };\n}\n",
      errors: 1,
    },
    {
      code: 'export type Ctor = abstract new (value: { a: string }) => void;\n',
      errors: 1,
    },
    {
      code: 'export const read = (\n  value: {\n    a: string;\n  },\n): string => value.a;\n',
      errors: [{
        messageId: 'nameTheType',
        line: 2,
        column: 10,
        endLine: 4,
        endColumn: 4,
      }],
    },
  ],
});
