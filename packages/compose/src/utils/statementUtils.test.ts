import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf, type Trust } from './bindingUtils';
import { applied } from './editUtils';
import { filledOnce } from './inlineUtils';
import { scopeOf } from './scopeUtils';
import { parse, referencesIn } from './sourceUtils';
import { flattenHeritage, spliceStatements } from './statementUtils';
import { settled } from './stepUtils';

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

// The first read of `x` in a body filled from an option module: a call's statements, or a type's members.
const filled = (body: string, option: string): string => {
  const sources = sourcesOf(`import { x } from './p';\n\n${body}`, { './p': option }, {}, NO_TRUST);
  const file = parse(sources.body);
  const checker = scopeOf(file, sources.modules, sources.held);
  const [local] = referencesIn(file, 'x');

  if (local === undefined) {
    throw new Error(`No x in ${body}`);
  }

  const edits = ts.isCallExpression(local.parent)
    ? spliceStatements(sources.body, sources, local, local.parent, checker)
    : flattenHeritage(sources.body, sources, local, checker);

  return applied(sources.body, edits);
};

const lines = (...written: string[]): string => {
  return `${written.join('\n')}\n`;
};

const RETURN_ONE = '  return { value };';
const RETURN_BOTH = '  return { value, other };';
const RETURN_VALUE = '    return value;';

const CLOSE = '};';

const IF_K = [
  '  if (k) {',
  '    log(k);',
  '  }',
];

const COMMENTED = lines(
  'export const x = () => {',
  '',
  '  // Why.',
  '  const value = {',
  '    a: 1,',
  '  };',
  '',
  RETURN_ONE,
  CLOSE,
);

const LABEL_COMMENTED = [
  '  /** The label shown. */',
  '  label: string;',
  '  // why',
  '  other: number;',
];

const LABEL_DOCUMENTED = [
  '  /**',
  '   * Shown.',
  '   */',
  '  label: string; // tail',
];

const LABEL_DEEPER = [
  '    /**',
  '     * Shown.',
  '     */',
  '    label: string; // tail',
];

const MEMBER = lines('export interface x {', '  readonly more: number;', '}');
const HOOK = lines('export const x = () => {', '  const value = 1;', '', '  return { value };', '};');

describe('flattenHeritage', () => {
  it.each([
    [
      lines('interface Props extends Own, x {', '  readonly name: string;', '}'),
      MEMBER,
      lines('interface Props extends Own {', '  readonly name: string;', '  readonly more: number;', '}'),
    ],
    [
      lines('interface Props extends Own<string>, More, x {', '    readonly name: string;', '}'),
      MEMBER,
      lines(
        'interface Props extends Own<string>, More {',
        '    readonly name: string;',
        '    readonly more: number;',
        '}',
      ),
    ],
    [
      lines('interface Props extends x {', '}'),
      lines('export type x = {', '    readonly on: (', '        page: string,', '    ) => void;', '};'),
      lines('interface Props {', '  readonly on: (', '      page: string,', '  ) => void;', '}'),
    ],
    [
      lines('interface Props extends x {', '  readonly name: string;', '}'),
      'export type x = Record<never, never>;\n',
      lines('interface Props {', '  readonly name: string;', '}'),
    ],
    [
      lines('interface Props extends x {', '  readonly name: string;', '}'),
      'export type x = Record<never,never>;\n',
      lines('interface Props {', '  readonly name: string;', '}'),
    ],
    [
      lines('interface Props extends x {', '  [key: string]: unknown;', '}'),
      lines('export interface x {', '  (): void;', '  readonly more: number;', '}'),
      lines('interface Props {', '  [key: string]: unknown;', '  (): void;', '  readonly more: number;', '}'),
    ],
    [
      lines('interface Props extends x {', '  own: string;', '}'),
      lines('export interface x { // not a member\'s', ...LABEL_COMMENTED, '}'),
      lines('interface Props {', '  own: string;', ...LABEL_COMMENTED, '}'),
    ],
    [
      lines('interface Props extends x {', '  own: string; // mine', '}'),
      MEMBER,
      lines('interface Props {', '  own: string; // mine', '  readonly more: number;', '}'),
    ],
    [
      lines('{', '  interface Props extends x {', '    own: string;', '  }', '}'),
      lines('export interface x {', '', ...LABEL_DOCUMENTED, '}'),
      lines('{', '  interface Props {', '    own: string;', ...LABEL_DEEPER, '  }', '}'),
    ],
  ])('fills %j from %j', (body, option, expected) => {
    const written = filled(body, option);

    expect(written).toBe(expected);
  });

  it.each([
    [
      'type Props = Own & x;\n',
      MEMBER,
      /can only be used as a type an interface extends/u,
    ],
    [
      'class Props implements x {}\n',
      MEMBER,
      /can only be used as a type an interface extends/u,
    ],
    [
      'y = x;\n',
      MEMBER,
      /can only be used as a type an interface extends/u,
    ],
    [
      lines('interface Props {', '  readonly more: x;', '}'),
      MEMBER,
      /can only be used as a type an interface extends/u,
    ],
    [
      'interface Props extends x {}\n',
      lines('type Local = number;', '', 'export interface x {', '  readonly more: Local;', '}'),
      /"Local" is declared in an option module and read by code that left it behind/u,
    ],
    [
      'interface Props extends x {}\n',
      'export type x = Other;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends x {}\n',
      'export type x = Other & Record<never, never>;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends x {}\n',
      'export type x = Record<never, never> & Other;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends x {}\n',
      'export const x = 1;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends Own, x<string> {}\n',
      MEMBER,
      /takes no type arguments here: x<string>/u,
    ],
    [
      'interface Props extends x {}\n',
      'export interface x<T> {\n  readonly more: T;\n}\n',
      /takes no type arguments here/u,
    ],
    [
      'interface Props extends x {}\n',
      'export type x<T> = {\n  readonly more: T;\n};\n',
      /takes no type arguments here/u,
    ],
    [
      lines('interface Props extends x {', '  readonly more: string;', '}'),
      MEMBER,
      /Both the base and the option declare the member "more" of: Props/u,
    ],
  ])('refuses %j from %j', (body, option, message) => {
    const run = (): string => {
      return filled(body, option);
    };

    expect(run).toThrow(message);
  });
});

describe('spliceStatements', () => {
  it.each([
    [
      'a holder named as the member it reads',
      lines('run = () => {', '  const value = x();', '', '  return value.value;', '};'),
      HOOK,
      lines('run = () => {', '  const value = 1;', '', '  return value;', '};'),
    ],
    [
      'a holder with only blanks after it on its line, the last statement\'s comment kept',
      lines('run = () => {', '  const y = x();  ', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1; // why', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1; // why  ', '  [k].forEach(log);', '};'),
    ],
    [
      'a holder read by member',
      lines('run = () => {', '  const thing = x();', '', '  return thing.value + thing.other;', '};'),
      lines('export const x = () => {', '  const value = 1;', '  const other = 2;', '', RETURN_BOTH, '};'),
      lines('run = () => {', '  const value = 1;', '  const other = 2;', '', '  return value + other;', '};'),
    ],
    [
      'a pattern that names what the statements answer',
      lines('run = () => {', '  const { value } = x();', '', '  return value;', '};'),
      HOOK,
      lines('run = () => {', '  const value = 1;', '', '  return value;', '};'),
    ],
    [
      'statements with a comment, moved to the indentation they land on',
      lines('run = () => {', '    const thing = x();', '', '    return thing.value;', '};'),
      COMMENTED,
      lines('run = () => {', '    // Why.', '    const value = {', '      a: 1,', '    };', '', RETURN_VALUE, CLOSE),
    ],
    [
      'statements that answer nothing, between two others',
      lines('run = () => {', '  const a = 1;', '  const thing = x();', '  const b = 2;', '};'),
      lines('export const x = () => {', '};'),
      lines('run = () => {', '  const a = 1;', '  const b = 2;', '};'),
    ],
    [
      'statements that answer nothing, first in their block',
      lines('run = () => {', '  const thing = x();', '', '  return 1;', '};'),
      lines('export const x = (): Record<never, never> => {', '  return {};', '};'),
      lines('run = () => {', '  return 1;', '};'),
    ],
    [
      'statements that answer nothing, after a blank line',
      lines('run = () => {', '  const a = 1;', '', '  const thing = x();', '', '  return a;', '};'),
      lines('export const x = () => {', '  return;', '};'),
      lines('run = () => {', '  const a = 1;', '', '  return a;', '};'),
    ],
    [
      'statements that answer nothing, last in the text',
      '{\n  const thing = x();',
      lines('export const x = () => {', '};'),
      '{\n',
    ],
    [
      'statements with no answer and a function that returns on its own',
      lines('{', '  const thing = x();', '}'),
      lines('export const x = () => {', '  log(() => {', '    return 1;', '  });', '};'),
      lines('{', '  log(() => {', '    return 1;', '  });', '}'),
    ],
    [
      'a function that only answers an expression',
      lines('{', '  const made = x();', '}'),
      'export const x = () => 4;\n',
      lines('{', '  const made = 4;', '}'),
    ],
    [
      'a call that is not all a statement holds',
      'y = [x()];\n',
      lines('export const x = () => {', '  return 4;', '};'),
      'y = [4];\n',
    ],
    [
      'a call in a catch block that binds no variable',
      lines('try {', '  run();', '}', 'catch {', '  const thing = x();', '', '  log(thing.value);', '}'),
      HOOK,
      lines('try {', '  run();', '}', 'catch {', '  const value = 1;', '', '  log(value);', '}'),
    ],
    [
      'a call that binds a name outside any block',
      'const made = x();\n',
      'export const x = () => 4;\n',
      'const made = 4;\n',
    ],
    [
      'statements written without semicolons, before base code that would join them (F21)',
      lines('run = () => {', '  const y = x();', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1', '', '  return { k }', '}'),
      lines('run = () => {', '  const k = 1;', '  [k].forEach(log);', '};'),
    ],
    [
      'an expression statement written without a semicolon, last of several',
      lines('run = () => {', '  const y = x();', '  (y.k)();', '};'),
      lines('export const x = () => {', '  const k = f;', '  log(k)', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = f;', '  log(k);', '  (k)();', '};'),
    ],
    [
      'a last statement written without a semicolon, its line comment kept after the semicolon',
      lines('run = () => {', '  const y = x();', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1 // why', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1; // why', '  [k].forEach(log);', '};'),
    ],
    [
      'a last statement written without a semicolon, its block comment kept after the semicolon',
      lines('run = () => {', '  const y = x();', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1 /* why */', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1; /* why */', '  [k].forEach(log);', '};'),
    ],
    [
      'a last statement ending in a semicolon, its line comment kept',
      lines('run = () => {', '  const y = x();', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1; // why', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1; // why', '  [k].forEach(log);', '};'),
    ],
    [
      'a last statement\'s comment left out where base code follows on the line it lands on',
      lines('run = () => {', '  const y = x(); log(y.k);', '};'),
      lines('export const x = () => {', '  const k = 1 // why', '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1; log(k);', '};'),
    ],
    [
      'statements that end in a block, which takes no semicolon',
      lines('run = () => {', '  const y = x();', '  [y.k].forEach(log);', '};'),
      lines('export const x = () => {', '  const k = 1;', ...IF_K, '', '  return { k };', '};'),
      lines('run = () => {', '  const k = 1;', ...IF_K, '  [k].forEach(log);', '};'),
    ],
  ])('fills %s', (_name, body, option, expected) => {
    const written = filled(body, option);

    expect(written).toBe(expected);
  });

  it('rewrites only the holder\'s own reads, past a callback binding its name (F7)', () => {
    const body = lines(
      'export const C = (items: { k: number }[]) => {',
      '  const y = x();',
      '',
      '  return items.map((y) => y.k).concat(y.k);',
      '};',
    );
    const option = lines('export const x = () => {', '  const k = 1;', '', '  return { k };', '};');
    const written = filled(body, option);
    const expected = lines(
      'export const C = (items: { k: number }[]) => {',
      '  const k = 1;',
      '',
      '  return items.map((y) => y.k).concat(k);',
      '};',
    );

    expect(written).toBe(expected);
  });

  it('splices statements for a holder read before its declaration (F1)', () => {
    const body = lines(
      'export const C = () => {',
      '  const later = () => y.kk + y.kk;',
      '  const y = x();',
      '',
      '  return later();',
      '};',
    );
    const option = lines('export const x = () => {', '  log();', '', '  return { kk };', '};');
    const written = filled(body, option);
    const expected = lines(
      'export const C = () => {',
      '  const later = () => kk + kk;',
      '  log();',
      '',
      '  return later();',
      '};',
    );

    expect(written).toBe(expected);
  });

  it('takes out only the statement when a read of the holder shares its line', () => {
    const body = lines('{', '  const thing = x(); log(thing.value);', '}');
    const option = lines('export const x = () => {', '  return { value };', '};');
    const written = filled(body, option);
    const expected = lines('{', '   log(value);', '}');

    expect(written).toBe(expected);
  });

  it('splices a name a nested scope binds again, which keeps its own reads', () => {
    const body = lines(
      'run = () => {',
      '  const thing = x();',
      '  const f = (value) => value;',
      '',
      '  return thing.value;',
      '};',
    );
    const written = filled(body, HOOK);
    const expected = lines(
      'run = () => {',
      '  const value = 1;',
      '  const f = (value) => value;',
      '',
      '  return value;',
      '};',
    );

    expect(written).toBe(expected);
  });

  it('refuses statements that declare a name the block reads from a module binding (F5)', () => {
    const body = lines(
      'const limit = 5;',
      '',
      'export const C = () => {',
      '  const y = x();',
      '',
      '  return limit + y.k;',
      '};',
    );
    const option = lines(
      'export const x = () => {',
      '  const limit = 1;',
      '  const k = limit;',
      '',
      '  return { k };',
      '};',
    );

    const run = (): string => {
      return filled(body, option);
    };

    expect(run).toThrow('The option\'s statements declare "limit", which the base reads from outside the block: limit');
  });

  it.each([
    [
      lines('{', '  const thing = x(1);', '}'),
      HOOK,
      /take no parameters/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      lines('export const x = (seed: number) => {', '  return {};', '};'),
      /take no parameters/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      lines('export const x = () => {', '  if (flag) {', '    return {};', '  }', '', '  return {};', '};'),
      /may only return at the end/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      lines('export const x = () => {', '  const inner = 1;', '', '  return { value: inner };', '};'),
      /must answer an object of plain names: \{ value: inner \}/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      lines('export const x = () => {', '  const value = 1;', '', '  return value;', '};'),
      /must answer an object of plain names: value/u,
    ],
    [
      lines('run = (value: number) => {', '  const thing = x();', '', '  return thing.value;', '};'),
      HOOK,
      /declare "value", which the base already binds here/u,
    ],
    [
      lines('{', '  const value = 2;', '  const thing = x();', '}'),
      HOOK,
      /declare "value", which the base already binds here/u,
    ],
    [
      lines('{', '  const thing = x();', '', '  log(thing);', '}'),
      HOOK,
      /"thing" can only be read by a member/u,
    ],
    [
      lines('{', '  const thing = x();', '', '  log(thing.gone);', '}'),
      HOOK,
      /"thing" can only be read by a member/u,
    ],
    [
      lines('{', '  const { value: other } = x();', '}'),
      HOOK,
      /A pattern can only take, by their own names/u,
    ],
    [
      lines('{', '  const { gone } = x();', '}'),
      HOOK,
      /A pattern can only take, by their own names/u,
    ],
    [
      lines('{', '  const [value] = x();', '}'),
      HOOK,
      /A pattern can only take, by their own names/u,
    ],
    [
      lines('{', '  const a = 1, thing = x();', '}'),
      HOOK,
      /must only return one/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      'export const x = 4;\n',
      /must be an arrow function/u,
    ],
    [
      lines('{', '  const thing = x();', '}'),
      lines('export const x = () => {', '  var value = 1;', '', '  return { value };', '};'),
      /must declare with const or let, never var/u,
    ],
    [
      lines('try {', '  run();', '}', 'catch (value) {', '  const thing = x();', '}'),
      HOOK,
      /declare "value", which the base already binds here/u,
    ],
    [
      lines('{', '  const thing = x();', '', '  [1].map((value) => thing.value);', '}'),
      HOOK,
      /"value" is bound again around this read, so the option's one cannot land here: thing.value/u,
    ],
    [
      lines('run = () => {', '  const thing = x();', '', '  return thing.outer;', '};'),
      lines('const outer = 1;', '', 'export const x = () => {', '  log();', '', '  return { outer };', '};'),
      /"outer" is declared in an option module and read by code that left it behind: thing.outer/u,
    ],
    [
      lines('run = () => {', '  const { value, other } = x();', '', '  log(value);', '};'),
      HOOK,
      /A pattern can only take, by their own names, what the option's statements answer/u,
    ],
    [
      lines('run = () => {', '  const thing = log(x());', '};'),
      HOOK,
      /A function inlined as an expression must only return one/u,
    ],
    [
      lines('run = () => {', '  return x();', '};'),
      'export const x = (): void => {};\n',
      /A function inlined as an expression must only return one/u,
    ],
    [
      lines('const thing = x();', '', 'log(thing.value);'),
      HOOK,
      /A function inlined as an expression must only return one/u,
    ],
    [
      lines('run = () => {', '  for (const thing = x(); ; ) {', '    log(thing.value);', '  }', '};'),
      HOOK,
      /A function inlined as an expression must only return one/u,
    ],
  ])('refuses %j from %j', (body, option, message) => {
    const run = (): string => {
      return filled(body, option);
    };

    expect(run).toThrow(message);
  });
});

const EMPTY_CASE = 'export const x = (): void => {};\n';
const ASYNC_CASE = lines('export const x = async (): Promise<void> => {', '  await log();', '};');
const BY_NAME = /A case takes each argument as a name the base passes under the parameter's own name/u;
const AWAITED_IN_SYNC = /An awaited statement is spliced only into an async function/u;

describe('spliceStatements, on a case called as a statement', () => {
  it.each([
    [
      'a case whose first statement shares the line of its opening brace, its blank lines kept',
      lines('run = () => {', '  x();', '};'),
      lines('export const x = (): void => { log(1);', '', ' log(2);', '};'),
      lines('run = () => {', '  log(1);', '', '  log(2);', '};'),
    ],
    [
      'a sync case declaring with using, which awaits nothing',
      lines('run = () => {', '  x();', '};'),
      lines('export const x = (): void => {', '  using a = b;', '};'),
      lines('run = () => {', '  using a = b;', '};'),
    ],
    [
      'a case opening on a comment at the start of its line',
      lines('run = () => {', '  x();', '};'),
      lines('export const x = (): void => {', '//why', 'log(1);', '};'),
      lines('run = () => {', '  //why', '  log(1);', '};'),
    ],
    [
      'an empty case, last in its block after a blank line',
      lines('describe(\'s\', () => {', '  it(\'a\', f);', '', '  x();', '});'),
      EMPTY_CASE,
      lines('describe(\'s\', () => {', '  it(\'a\', f);', '});'),
    ],
    [
      'an empty case between two statements',
      lines('{', '  a();', '', '  x();', '', '  b();', '}'),
      EMPTY_CASE,
      lines('{', '  a();', '', '  b();', '}'),
    ],
    [
      'an empty case, last in the file',
      lines('log(1);', '', 'x();'),
      EMPTY_CASE,
      lines('log(1);'),
    ],
    [
      'a case that takes an argument under its own name',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = (a: number): void => {', '  log(a);', '  log(2);', '};'),
      lines('run = (a) => {', '  log(a);', '  log(2);', '};'),
    ],
    [
      'a case at the top level, declaring a helper',
      lines('x();', '', 'log(1);'),
      lines('export const x = (): void => {', '  const helper = 1;', '};'),
      lines('const helper = 1;', '', 'log(1);'),
    ],
    [
      'an async case the base awaits, in an async function',
      lines('run = async () => {', '  await x();', '};'),
      ASYNC_CASE,
      lines('run = async () => {', '  await log();', '};'),
    ],
    [
      'a case that awaits inside a function of its own',
      lines('run = () => {', '  x();', '};'),
      lines('export const x = (): void => {', '  it(\'a\', async () => {', '    await log();', '  });', '};'),
      lines('run = () => {', '  it(\'a\', async () => {', '    await log();', '  });', '};'),
    ],
    [
      'a case with a loop that awaits nothing, in a function that is not async',
      lines('run = () => {', '  x();', '};'),
      lines('export const x = (): void => {', '  for (const a of b) {', '    log(a);', '  }', '};'),
      lines('run = () => {', '  for (const a of b) {', '    log(a);', '  }', '};'),
    ],
    [
      'a case holding a function that returns on its own',
      lines('{', '  x();', '}'),
      lines('export const x = (): void => {', '  log(() => {', '    return 1;', '  });', '};'),
      lines('{', '  log(() => {', '    return 1;', '  });', '}'),
    ],
  ])('splices %s', (_name, body, option, expected) => {
    const written = filled(body, option);

    expect(written).toBe(expected);
  });

  it.each([
    [
      'an argument that is not a name',
      lines('{', '  x(1);', '}'),
      lines('export const x = (a: number): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'an argument under another name',
      lines('run = (b) => {', '  x(b);', '};'),
      lines('export const x = (a: number): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'an argument too few',
      lines('{', '  x();', '}'),
      lines('export const x = (a: number): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'an argument too many',
      lines('run = (a) => {', '  x(a);', '};'),
      EMPTY_CASE,
      BY_NAME,
    ],
    [
      'a parameter with a default',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = (a = 1): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'a rest parameter',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = (...a: number[]): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'an optional parameter',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = (a?: number): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'a destructured parameter',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = ({ a }: { a: number }): void => {', '  log(a);', '};'),
      BY_NAME,
    ],
    [
      'a case that declares its own parameter\'s name',
      lines('run = (a) => {', '  x(a);', '};'),
      lines('export const x = (a: number): void => {', '  const a = 2;', '};'),
      /The case declares "a", the name of its own parameter: x\(a\)/u,
    ],
    [
      'a case that returns',
      lines('{', '  x();', '}'),
      lines('export const x = (): void => {', '  log();', '', '  return;', '};'),
      /A case called as a statement may not return/u,
    ],
    [
      'a case that returns from within a branch',
      lines('{', '  x();', '}'),
      lines('export const x = (): void => {', '  if (k) {', '    return;', '  }', '};'),
      /A case called as a statement may not return/u,
    ],
    [
      'a sync case the base awaits',
      lines('run = async () => {', '  await x();', '};'),
      EMPTY_CASE,
      /Only an async case is awaited where the base calls it: x\(\)/u,
    ],
    [
      'an async case the base does not await',
      lines('run = async () => {', '  x();', '};'),
      ASYNC_CASE,
      /An async case is spliced only where the base awaits its call: x\(\)/u,
    ],
    [
      'an awaited statement spliced into a function that is not async',
      lines('run = () => {', '  await x();', '};'),
      ASYNC_CASE,
      AWAITED_IN_SYNC,
    ],
    [
      'an awaited statement spliced at the top level',
      lines('await x();'),
      ASYNC_CASE,
      AWAITED_IN_SYNC,
    ],
    [
      'a `for await` spliced into a function that is not async',
      lines('run = () => {', '  await x();', '};'),
      lines('export const x = async () => {', '  for await (const a of b) {', '    log(a);', '  }', CLOSE),
      AWAITED_IN_SYNC,
    ],
    [
      'an `await using` spliced into a function that is not async',
      lines('run = () => {', '  await x();', '};'),
      lines('export const x = async (): Promise<void> => {', '  await using a = b;', '};'),
      AWAITED_IN_SYNC,
    ],
    [
      'a name the block declares',
      lines('{', '  const helper = 2;', '  x();', '}'),
      lines('export const x = (): void => {', '  const helper = 1;', '};'),
      /declare "helper", which the base already binds here: x\(\);/u,
    ],
    [
      'a name the base imports, declared at the top level',
      lines('import { helper } from \'h\';', '', 'x();'),
      lines('export const x = (): void => {', '  const helper = 1;', '};'),
      /declare "helper", which the base already binds here: x\(\);/u,
    ],
    [
      'a name the block reads from outside it',
      lines('const helper = 2;', '', '{', '  x();', '  log(helper);', '}'),
      lines('export const x = (): void => {', '  const helper = 1;', '};'),
      /declare "helper", which the base reads from outside the block: helper/u,
    ],
    [
      'a read the landing site binds again',
      lines('run = (log) => {', '  x();', '};'),
      lines('export const x = (): void => {', '  log();', '};'),
      /"log" would read the base's own binding of that name where the option's code lands: x\(\);/u,
    ],
    [
      'a `var`',
      lines('{', '  x();', '}'),
      lines('export const x = (): void => {', '  var helper = 1;', '};'),
      /must declare with const or let, never var/u,
    ],
    [
      'a case that is not a statement of a block or the file',
      lines('if (k) x();'),
      EMPTY_CASE,
      /A function inlined as an expression must only return one/u,
    ],
  ])('refuses %s', (_name, body, option, message) => {
    const run = (): string => {
      return filled(body, option);
    };

    expect(run).toThrow(message);
  });
});

// The base's body with every read of its options filled, as the composition fills it.
const composed = (base: string, options: Readonly<Record<string, string>>): string => {
  const sources = sourcesOf(base, options, {}, NO_TRUST);
  const start = parse(sources.body);
  const { text } = settled(start, (current, file) => {
    return filledOnce(current, file, sources);
  });

  return text;
};

const HELPER_CASE = lines('export const h = (): void => {', '  const helper = 1;', '};');
const READER_CASE = lines('export const c = (): void => {', '  log(helper);', '};');
const SHARED = `${HELPER_CASE}\n${READER_CASE}`;
const IMPORTS = 'import { c, h } from \'./p\';\n\n';
const UNSPLICED = /"helper" is declared by another case of its option, not spliced at the top level before it: c\(\);/u;
const OTHER_OPTION = '"helper" would read what another option\'s case declares, where the option\'s code lands: c();';
const ELSEWHERE = /"helper" does not read, where the case lands, what another case of its option declares: c\(\);/u;

describe('spliceStatements, on a case reading what another case of its option declares', () => {
  it.each([
    [
      'in a script',
      lines('h();', '', 'describe(\'s\', () => {', '  c();', '});'),
      SHARED,
      lines('const helper = 1;', '', 'describe(\'s\', () => {', '  log(helper);', '});'),
    ],
    [
      'in a module, beside exports that are not cases',
      lines('h();', '', 'export const run = () => {', '  c();', '};'),
      lines(
        SHARED,
        'export const n = 1;',
        'export const m = (): number => 2;',
        'export interface I {}',
      ),
      lines('const helper = 1;', '', 'export const run = () => {', '  log(helper);', '};'),
    ],
  ])('splices it %s', (_name, body, option, expected) => {
    const written = composed(IMPORTS + body, { './p': option });

    expect(written).toBe(expected);
  });

  it.each([
    [
      'a case spliced after it',
      lines('describe(\'s\', () => {', '  c();', '});', '', 'h();'),
      SHARED,
      UNSPLICED,
    ],
    [
      'a case spliced only into a block',
      lines('describe(\'s\', () => {', '  h();', '  c();', '});'),
      SHARED,
      UNSPLICED,
    ],
    [
      'a name the landing site binds again',
      lines('h();', '', 'run = (helper) => {', '  c();', '};'),
      SHARED,
      ELSEWHERE,
    ],
    [
      'a name read in another meaning',
      lines('h();', '', '{', '  c();', '}'),
      `${HELPER_CASE}\n${lines('export const c = (): void => {', '  let a: helper;', '};')}`,
      ELSEWHERE,
    ],
    [
      'a name its own module also declares',
      lines('h();', '', '{', '  c();', '}'),
      `const helper = 2;\n\n${SHARED}`,
      /"helper" would read the base's own binding of that name where the option's code lands: c\(\);/u,
    ],
    [
      'a name two cases declare',
      lines('h();', '', '{', '  c();', '}'),
      `${HELPER_CASE}\n${lines('export const c = (): void => {', '  const helper = 2;', '};')}`,
      /Two cases of one option declare "helper": h\(\)/u,
    ],
  ])('refuses %s', (_name, body, option, message) => {
    const run = (): string => {
      return composed(IMPORTS + body, { './p': option });
    };

    expect(run).toThrow(message);
  });

  it('refuses a read of what another option\'s case declares', () => {
    const base = lines('import { h } from \'./p\';', 'import { c } from \'./q\';', '', 'h();', '', '{', '  c();', '}');
    const options = {
      './p': HELPER_CASE,
      './q': READER_CASE,
    };

    const run = (): string => {
      return composed(base, options);
    };

    expect(run).toThrow(OTHER_OPTION);
  });
});
