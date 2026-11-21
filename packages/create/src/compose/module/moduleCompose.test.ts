import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { moduleCompose } from './moduleCompose';

interface Case {
  name: string;
  base: string;
  option: string;
  expected: string;
}

interface Refusal {
  name: string;
  base: string;
  option: string;
  message: RegExp;
}

const templates = join(import.meta.dirname, '../../../templates');
const fixtures = join(templates, 'codegen/compose-sources/vite-react');
const shells = join(templates, 'shells/vite-react');

const readFixture = (name: string): string => {
  const path = join(fixtures, name);

  return readFileSync(path, 'utf8');
};

const readShipped = (name: string): string => {
  const path = join(shells, name);

  return readFileSync(path, 'utf8');
};

const aliasGroup = (alias: string): string[] => {
  const group = [`^${alias}(?:/|$)`];

  return group;
};

// The base layer's groups for a React project with these aliases, as `buildGroups` orders them.
const GROUPS = [
  ['^node:'],
  [
    '^react$',
    '^react-dom$',
    '^react/',
    '^react-',
    '^@react',
  ],
  [String.raw`^@?\w`],
  aliasGroup('@config'),
  aliasGroup('@styles'),
  aliasGroup('@store'),
  aliasGroup('@ui'),
  aliasGroup('@router'),
  [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
  [String.raw`^\./`],
  [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
  [String.raw`^.+\.s?css$`],
];

const HEADERS = [
  ['react-routers', 'atomic'],
  ['react-routers', 'css'],
  ['single-page', 'atomic'],
  ['single-page', 'css'],
  ['tanstack-router', 'atomic'],
  ['tanstack-router', 'css'],
];

describe('moduleCompose, on the shipped app header', () => {
  it.each(HEADERS)('writes the shipped file for %s with %s', (router, styling) => {
    const base = readFixture('app-header/AppHeader.tsx');
    const routerOption = readFixture(`app-header/router.${router}.tsx`);
    const stylingOption = readFixture(`app-header/styling.${styling}.ts`);
    const composed = moduleCompose({
      base,
      options: {
        './router': routerOption,
        './styling': stylingOption,
      },
      importGroups: GROUPS,
    });
    const folder = `router/${router}/styling/${styling}`;
    const expected = readShipped(`${folder}/src/components/features/app-header/AppHeader.tsx`);

    expect(composed).toBe(expected);
  });
});

const HOMES = [
  [
    'libraries',
    'atomic',
    'store/libraries',
  ],
  [
    'libraries',
    'css',
    'store/libraries',
  ],
  [
    'react-state',
    'atomic',
    'data/redux-free/store/react-state',
  ],
  [
    'react-state',
    'css',
    'data/redux-free/store/react-state',
  ],
];

describe('moduleCompose, on the shipped home page', () => {
  it.each(HOMES)('writes the shipped file for %s with %s', (store, styling, folder) => {
    const base = readFixture('home-page/HomePage.tsx');
    const storeOption = readFixture(`home-page/store.${store}.tsx`);
    const stylingOption = readFixture(`home-page/styling.${styling}.ts`);
    const composed = moduleCompose({
      base,
      options: {
        './store': storeOption,
        './styling': stylingOption,
      },
      importGroups: GROUPS,
    });
    const expected = readShipped(`${folder}/styling/${styling}/src/pages/home/HomePage.tsx`);

    expect(composed).toBe(expected);
  });
});

const SHEETS = [
  ['libraries', 'store/libraries'],
  ['react-state', 'data/redux-free/store/react-state'],
];

describe('moduleCompose, on the shipped home page style table', () => {
  it.each(SHEETS)('writes the shipped file for %s', (store, folder) => {
    const base = readFixture('home-page-styles/HomePage.styles.ts');
    const storeOption = readFixture(`home-page-styles/store.${store}.ts`);
    const composed = moduleCompose({
      base,
      options: { './store': storeOption },
      importGroups: GROUPS,
    });
    const expected = readShipped(`${folder}/styling/stylex/src/pages/home/HomePage.styles.ts`);

    expect(composed).toBe(expected);
  });
});

const CASES: Case[] = [
  {
    name: 'a base binding that shadows a parameter binding, read as the base wrote it',
    base: 'import { x } from \'./p\';\n\nexport const y = (x: number) => x;\n',
    option: 'export const x = 1;\n',
    expected: 'export const y = (x: number) => x;\n',
  },
  {
    name: 'a member of an object export',
    base: 'import { table } from \'./p\';\n\nexport const size = table.size;\n',
    option: 'export const table = { size: 4 };\n',
    expected: 'export const size = 4;\n',
  },
  {
    name: 'a member through satisfies',
    base: 'import { table } from \'./p\';\n\nexport const size = table.size;\n',
    option: 'export const table = { size: 4 } satisfies Record<string, number>;\n',
    expected: 'export const size = 4;\n',
  },
  {
    name: 'a member call, its argument kept whole',
    base: 'import { table } from \'./p\';\n\nexport const twice = (x: number) => table.double(x + 1);\n',
    option: 'export const table = { double: (n: number) => n * 2 };\n',
    expected: 'export const twice = (x: number) => (x + 1) * 2;\n',
  },
  {
    name: 'a member call whose function returns from a block',
    base: 'import { table } from \'./p\';\n\nexport const twice = (x: number) => table.double(x);\n',
    option: 'export const table = { double: (n: number) => {\n  return n * 2;\n} };\n',
    expected: 'export const twice = (x: number) => x * 2;\n',
  },
  {
    name: 'a direct call',
    base: 'import { loud } from \'./p\';\n\nexport const title = loud(\'a\');\n',
    option: 'export const loud = (text: string) => `${text}!`;\n',
    expected: 'export const title = `${\'a\'}!`;\n',
  },
  {
    name: 'a constant, parenthesized where the position needs it',
    base: 'import { LIMIT } from \'./p\';\n\nexport const next = LIMIT * 2;\n',
    option: 'export const LIMIT = 1 + 2;\n',
    expected: 'export const next = (1 + 2) * 2;\n',
  },
  {
    name: 'a type an interface extends, beside one it keeps',
    base: [
      'import type { Extra } from \'./p\';',
      '',
      'export interface Props extends Own, Extra {',
      '  readonly name: string;',
      '}',
      '',
    ].join('\n'),
    option: 'export interface Extra {\n  readonly more: number;\n}\n',
    expected: 'export interface Props extends Own {\n  readonly name: string;\n  readonly more: number;\n}\n',
  },
  {
    name: 'a type literal joining an empty interface',
    base: 'import type { Extra } from \'./p\';\n\nexport interface Props extends Extra {\n}\n',
    option: 'export type Extra = {\n    readonly more: number;\n};\n',
    expected: 'export interface Props {\n  readonly more: number;\n}\n',
  },
  {
    name: 'an empty object type, which only leaves',
    base: [
      'import type { Extra } from \'./p\';',
      '',
      'export interface Props extends Extra {',
      '  readonly name: string;',
      '}',
      '',
    ].join('\n'),
    option: 'export type Extra = Record<never, never>;\n',
    expected: 'export interface Props {\n  readonly name: string;\n}\n',
  },
  {
    name: 'a one-line component, its key and string attribute carried over',
    base: 'import { Item } from \'./p\';\n\nexport const list = <ul><Item key="a" label="A" /></ul>;\n',
    option: 'export const Item = ({ label }: Props) => <li title={label}>{label}</li>;\n',
    expected: 'export const list = <ul><li key="a" title={\'A\'}>{\'A\'}</li></ul>;\n',
  },
  {
    name: 'a component with no props, and a bare attribute it ignores',
    base: 'import { Rule } from \'./p\';\n\nexport const line = <Rule dense />;\n',
    option: 'export const Rule = () => <hr />;\n',
    expected: 'export const line = <hr />;\n',
  },
  {
    name: 'children the option does not render, when the base passes none',
    base: 'import { Box } from \'./p\';\n\nexport const box = (\n  <Box />\n);\n',
    option: [
      'export const Box = ({ children }: Props) => {',
      '  return (',
      '    <div>',
      '      {children}',
      '    </div>',
      '  );',
      '};',
      '',
    ].join('\n'),
    expected: 'export const box = (\n  <div>\n  </div>\n);\n',
  },
  {
    name: 'statements, their answer read by name',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value + thing.other;',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  const value = 1;',
      '  const other = 2;',
      '',
      '  return { value, other };',
      '};',
      '',
    ].join('\n'),
    expected: 'export const run = () => {\n  const value = 1;\n  const other = 2;\n\n  return value + other;\n};\n',
  },
  {
    name: 'statements that answer nothing, between two others',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const a = 1;',
      '  const thing = useThing();',
      '  const b = 2;',
      '',
      '  return a + b;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n};\n',
    expected: 'export const run = () => {\n  const a = 1;\n  const b = 2;\n\n  return a + b;\n};\n',
  },
  {
    name: 'a call that initializes a constant with an expression',
    base: 'import { make } from \'./p\';\n\nexport const made = make();\n',
    option: 'export const make = () => 4;\n',
    expected: 'export const made = 4;\n',
  },
  {
    name: 'a comment directive the option answers',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#note\n  return x;\n};\n',
    option: 'export const note = \'Why this is so.\';\nexport const x = 1;\n',
    expected: 'export const run = () => {\n  // Why this is so.\n  return 1;\n};\n',
  },
  {
    name: 'a comment directive the option leaves out',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#note\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    expected: 'export const run = () => {\n  return 1;\n};\n',
  },
  {
    name: 'a constant read as a shorthand member',
    base: 'import { size } from \'./p\';\n\nexport const box = { size };\n',
    option: 'export const size = 4;\n',
    expected: 'export const box = { size: 4 };\n',
  },
  {
    name: 'an object answered from an arrow body, kept in parentheses',
    base: 'import { table } from \'./p\';\n\nexport const make = () => table.empty;\n',
    option: 'export const table = { empty: {} };\n',
    expected: 'export const make = () => ({});\n',
  },
];

const REFUSALS: Refusal[] = [
  {
    name: 'an export the option module lacks',
    base: 'import { x } from \'./p\';\n\nexport const y = x;\n',
    option: 'export const other = 1;\n',
    message: /"x" has no export in its option module \(\.\/p\)/u,
  },
  {
    name: 'a member the option object lacks',
    base: 'import { table } from \'./p\';\n\nexport const y = table.gone;\n',
    option: 'export const table = { size: 4 };\n',
    message: /has no member "gone"/u,
  },
  {
    name: 'a member read from something that is not an object',
    base: 'import { table } from \'./p\';\n\nexport const y = table.size;\n',
    option: 'export const table = 4;\n',
    message: /must be an object literal/u,
  },
  {
    name: 'a member called that is not a function',
    base: 'import { table } from \'./p\';\n\nexport const y = table.size();\n',
    option: 'export const table = { size: 4 };\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a member with an effect read as a value',
    base: 'import { table } from \'./p\';\n\nexport const y = table.now;\n',
    option: 'export const table = { now: Date.now() };\n',
    message: /must have no effect/u,
  },
  {
    name: 'a call of an export that is not a function',
    base: 'import { make } from \'./p\';\n\nexport const y = [make()];\n',
    option: 'export const make = 4;\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a function inlined as an expression that does more than return',
    base: 'import { make } from \'./p\';\n\nexport const y = [make()];\n',
    option: 'export const make = () => {\n  const a = 1;\n\n  return a;\n};\n',
    message: /must only return one/u,
  },
  {
    name: 'an argument that the option\'s own binding would capture',
    base: 'import { table } from \'./p\';\n\nexport const y = (inner: number) => table.twice(inner);\n',
    option: 'export const table = { twice: (n: number) => [n].map((inner) => inner + n) };\n',
    message: /would capture it/u,
  },
  {
    name: 'an argument with an effect read twice',
    base: 'import { table } from \'./p\';\n\nexport const y = table.twice(next());\n',
    option: 'export const table = { twice: (n: number) => n + n };\n',
    message: /must be read once, and "n" is read 2 times/u,
  },
  {
    name: 'a call with fewer arguments than parameters',
    base: 'import { table } from \'./p\';\n\nexport const y = table.twice();\n',
    option: 'export const table = { twice: (n: number) => n + n };\n',
    message: /plain name with an argument/u,
  },
  {
    name: 'a constant with an effect',
    base: 'import { now } from \'./p\';\n\nexport const y = now;\n',
    option: 'export const now = Date.now();\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'an option type used outside an extends clause',
    base: 'import type { Extra } from \'./p\';\n\nexport type Props = Own & Extra;\n',
    option: 'export interface Extra {\n  readonly more: number;\n}\n',
    message: /only be used as a type an interface extends/u,
  },
  {
    name: 'an option type an interface cannot take the members of',
    base: 'import type { Extra } from \'./p\';\n\nexport interface Props extends Extra {\n}\n',
    option: 'export type Extra = Other;\n',
    message: /must be an interface, a type literal or Record<never, never>/u,
  },
  {
    name: 'statements that take a parameter',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing(1);',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = (seed: number) => {\n  const value = seed;\n\n  return { value };\n};\n',
    message: /take no parameters/u,
  },
  {
    name: 'statements that return early',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  if (flag) {',
      '    return { value };',
      '  }',
      '',
      '  const value = 1;',
      '',
      '  return { value };',
      '};',
      '',
    ].join('\n'),
    message: /may only return at the end/u,
  },
  {
    name: 'statements that answer something other than plain names',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const inner = 1;\n\n  return { value: inner };\n};\n',
    message: /must answer an object of plain names/u,
  },
  {
    name: 'statements that declare a name the base already binds',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = (value: number) => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    message: /declare "value", which the base already binds here/u,
  },
  {
    name: 'a holder read whole rather than by member',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    message: /"thing" can only be read by a member/u,
  },
  {
    name: 'a component that is not a function',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = 4;\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a component that returns no element',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = () => 4;\n',
    message: /must return one element/u,
  },
  {
    name: 'a component that renames a prop',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item label="a" />;\n',
    option: 'export const Item = ({ label: text }: Props) => <li>{text}</li>;\n',
    message: /must destructure plain props/u,
  },
  {
    name: 'a prop the base does not pass',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = ({ label }: Props) => <li>{label}</li>;\n',
    message: /needs "label", which the base does not pass/u,
  },
  {
    name: 'an ignored attribute with an effect',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item stamp={Date.now()} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /ignores "stamp", whose value has an effect/u,
  },
  {
    name: 'children the option does not render',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item>text</Item>;\n',
    option: 'export const Item = () => <li />;\n',
    message: /must render \{children\} once/u,
  },
  {
    name: 'children used as a value',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item>text</Item>;\n',
    option: 'export const Item = ({ children }: Props) => <li title={String(children)}>{children}</li>;\n',
    message: /can only render its children in place/u,
  },
  {
    name: 'a key on a component that returns a fragment',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item key="a" />;\n',
    option: 'export const Item = () => <></>;\n',
    message: /A key needs an element/u,
  },
  {
    name: 'a spread that is not a rest binding',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item {...props} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /Only a rest binding can be spread/u,
  },
  {
    name: 'two spreads on one component',
    base: 'import { Item } from \'./p\';\n\nexport const List = ({ ...a }) => <Item {...a} {...a} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /One rest spread at most/u,
  },
  {
    name: 'a rest binding also read elsewhere',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ ...rest }) => <ul title={String(rest)}><Item {...rest} /></ul>;',
      '',
    ].join('\n'),
    option: 'export const Item = () => <li />;\n',
    message: /"rest" is still read after composing/u,
  },
  {
    name: 'a comment directive naming a module that is not a parameter',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./q#note\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    message: /\.\/q is not a parameter module/u,
  },
  {
    name: 'a comment directive naming an export that is not a string',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#x\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    message: /\.\/p#x must be a string/u,
  },
  {
    name: 'a default import of a parameter module',
    base: 'import p from \'./p\';\n\nexport const y = p;\n',
    option: 'export const x = 1;\n',
    message: /is a parameter module; import its exports by name/u,
  },
  {
    name: 'one name imported from two sources',
    base: 'import { join } from \'node:path\';\nimport { x } from \'./p\';\n\nexport const y = join(x);\n',
    option: 'import { join } from \'./strings\';\n\nexport const x = join(\'a\');\n',
    message: /"join" is imported from node:path#join and from \.\/strings#join/u,
  },
];

const MORE_CASES: Case[] = [
  {
    name: 'several kinds in one base, each by its rule',
    base: [
      'import { Extra, LIMIT, make, table } from \'./p\';',
      '',
      'export interface Props extends Extra {',
      '  readonly name: string;',
      '}',
      '',
      'export const all = [make(), table.size, LIMIT];',
      '',
    ].join('\n'),
    option: [
      'export interface Extra {',
      '  readonly more: number;',
      '}',
      '',
      'export const LIMIT = 9;',
      'export const make = () => 4;',
      'export const table = { size: 2 };',
      '',
    ].join('\n'),
    expected: [
      'export interface Props {',
      '  readonly name: string;',
      '  readonly more: number;',
      '}',
      '',
      'export const all = [4, 2, 9];',
      '',
    ].join('\n'),
  },
  {
    name: 'a key onto a root that closes itself',
    base: 'import { Rule } from \'./p\';\n\nexport const line = <Rule key="k" />;\n',
    option: 'export const Rule = () => <hr />;\n',
    expected: 'export const line = <hr key="k" />;\n',
  },
  {
    name: 'statements into a block no function owns',
    base: 'import { useThing } from \'./p\';\n\n{\n  const thing = useThing();\n\n  log(thing.value);\n}\n',
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    expected: '{\n  const value = 1;\n\n  log(value);\n}\n',
  },
  {
    name: 'the imports the composed body reads, grouped and ordered',
    base: [
      'import fs, { readFileSync as read } from \'node:fs\';',
      'import * as path from \'node:path\';',
      'import { unused } from \'node:os\';',
      'import { scoped } from \'@scope/pkg\';',
      'import { pkg } from \'pkg\';',
      'import { x } from \'./p\';',
      'import \'./side.css\';',
      '',
      'import type { Shape } from \'./types\';',
      '',
      'export const y: Shape = [fs, read, path, scoped, pkg, x, b, a];',
      '',
    ].join('\n'),
    option: 'import { b, a } from \'../up\';\n\nexport const x = 1;\n',
    expected: [
      'import fs, { readFileSync as read } from \'node:fs\';',
      'import * as path from \'node:path\';',
      '',
      'import { scoped } from \'@scope/pkg\';',
      'import { pkg } from \'pkg\';',
      '',
      'import { a, b } from \'../up\';',
      '',
      'import type { Shape } from \'./types\';',
      '',
      'import \'./side.css\';',
      '',
      'export const y: Shape = [fs, read, path, scoped, pkg, 1, b, a];',
      '',
    ].join('\n'),
  },
  {
    name: 'what the base opens with, kept above the imports',
    base: [
      '// Why this file.',
      '\'use client\';',
      '',
      'import { a } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y = [a, x];',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      '// Why this file.',
      '\'use client\';',
      '',
      'import { a } from \'pkg\';',
      '',
      'export const y = [a, 1];',
      '',
    ].join('\n'),
  },
  {
    name: 'what the base opens with, when no import is left',
    base: [
      '\'use client\';',
      '',
      'import { x } from \'./p\';',
      '',
      'export const y = x;',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      '\'use client\';',
      '',
      'export const y = 1;',
      '',
    ].join('\n'),
  },
  {
    name: 'more than two names from one module, one per line, a type among them',
    base: [
      'import { c, type B, a } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y: B = [a, c, x];',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      'import {',
      '  a,',
      '  type B,',
      '  c,',
      '} from \'pkg\';',
      '',
      'export const y: B = [a, c, 1];',
      '',
    ].join('\n'),
  },
  {
    name: 'a last parameter nothing reads, dropped whole',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = () => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a parameter nothing reads after another, dropped with its comma',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = (ref: Ref, { label }: Props) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = (ref: Ref) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a parameter nothing reads before another, left as an empty pattern',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props, ref: Ref) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({}: Props, ref: Ref) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a pattern with a default, left as written',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label = make(), other }: Props) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ label = make(), other }: Props) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a rest binding, replaced by the names the option component reads from it',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ name, ...rest }: Props) => <Item title={name} {...rest} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = ({ title, current }: P) => <li title={title} hidden={current} />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ name, current }: Props) => <li title={name} hidden={current} />;',
      '',
    ].join('\n'),
  },
  {
    name: 'an import whose name is only spelled as a key, dropped',
    base: [
      'import { size } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y = { size: x };',
      '',
    ].join('\n'),
    option: 'export const x = 1;\n',
    expected: 'export const y = { size: 1 };\n',
  },
];

const MORE_REFUSALS: Refusal[] = [
  {
    name: 'a type read as a value',
    base: 'import { Extra } from \'./p\';\n\nexport const y = Extra;\n',
    option: 'export interface Extra {\n}\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'a declaration with no value read as one',
    base: 'import { later } from \'./p\';\n\nexport const y = later;\n',
    option: 'export let later: number;\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'a value an interface extends',
    base: 'import { x } from \'./p\';\n\nexport interface Props extends x {\n}\n',
    option: 'export const x = 1;\n',
    message: /must be an interface, a type literal or Record<never, never>/u,
  },
  {
    name: 'an attribute that is an element',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item icon=<b /> />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /must be a string or an expression/u,
  },
  {
    name: 'a spread of something that is not a name',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item {...a.b} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /Only a rest binding can be spread/u,
  },
  {
    name: 'a comment directive naming a type',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#Note\n  return x;\n};\n',
    option: 'export interface Note {\n}\nexport const x = 1;\n',
    message: /\.\/p#Note must be a string/u,
  },
  {
    name: 'a comment directive that shares its line with code',
    base: 'import { x } from \'./p\';\n\nexport const y = x; // @lintel:comment ./p#note\n',
    option: 'export const x = 1;\n',
    message: /is left after composing: @lintel:/u,
  },
  {
    name: 'a name the option component reads from the rest binding, bound by the base too',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ ...rest }: Props) => [1].map((current) => <Item key={current} {...rest} />);',
      '',
    ].join('\n'),
    option: [
      'export const Item = ({ current }: P) => <li hidden={current} />;',
      '',
    ].join('\n'),
    message: /reads "current" from "rest", and the base binds that name too/u,
  },
  {
    name: 'inlined code that reads a helper its option module keeps',
    base: [
      'import { x } from \'./p\';',
      '',
      'export const y = x();',
      '',
    ].join('\n'),
    option: [
      'const helper = 1;',
      '',
      'export const x = () => helper;',
      '',
    ].join('\n'),
    message: /"helper" is declared in an option module and read by code that left it behind/u,
  },
  {
    name: 'statements that bind a name the base imports',
    base: [
      'import { join } from \'node:path\';',
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return join(thing.value);',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  const join = 1;',
      '  const value = join;',
      '',
      '  return { value };',
      '};',
      '',
    ].join('\n'),
    message: /The option's statements declare "join", which the base reads from outside the block/u,
  },
  {
    name: 'a composed text that is no longer a module',
    base: [
      'import { x } from \'./p\';',
      '',
      'export const y = <x.Item />;',
      '',
    ].join('\n'),
    option: [
      'export const x = { Item: () => <li /> };',
      '',
    ].join('\n'),
    message: /The composed module does not parse/u,
  },
];

describe('moduleCompose, one rule at a time', () => {
  it.each([...CASES, ...MORE_CASES])('fills $name', ({
    base,
    option,
    expected,
  }) => {
    const composed = moduleCompose({
      base,
      options: { './p': option },
    });

    expect(composed).toBe(expected);
  });
});

describe('moduleCompose, refusing', () => {
  it.each([...REFUSALS, ...MORE_REFUSALS])('refuses $name', ({
    base,
    option,
    message,
  }) => {
    const run = (): string => {
      return moduleCompose({
        base,
        options: { './p': option },
      });
    };

    expect(run).toThrow(message);
  });
});
