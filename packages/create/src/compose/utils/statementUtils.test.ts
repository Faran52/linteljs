import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf } from './bindingUtils';
import { scopeOf } from './scopeUtils';
import { parse, referencesIn } from './sourceUtils';
import { flattenHeritage, spliceStatements } from './statementUtils';

// The first read of `x` in a body filled from an option module: a call's statements, or a type's members.
const filled = (body: string, option: string): string => {
  const sources = sourcesOf(`import { x } from './p';\n\n${body}`, { './p': option });
  const file = parse(sources.body);
  const checker = scopeOf(file, sources.modules);
  const [local] = referencesIn(file, 'x');

  if (local === undefined) {
    throw new Error(`No x in ${body}`);
  }

  return ts.isCallExpression(local.parent)
    ? spliceStatements(sources.body, sources, local, local.parent, checker)
    : flattenHeritage(sources.body, sources, local, checker);
};

const lines = (...written: string[]): string => {
  return `${written.join('\n')}\n`;
};

const RETURN_ONE = '  return { value };';
const RETURN_BOTH = '  return { value, other };';
const RETURN_VALUE = '    return value;';

const CLOSE = '};';

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
      lines('interface Props extends x {', '  [key: string]: unknown;', '}'),
      lines('export interface x {', '  (): void;', '  readonly more: number;', '}'),
      lines('interface Props {', '  [key: string]: unknown;', '  (): void;', '  readonly more: number;', '}'),
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
      'interface Props extends x {}\n',
      'export type x = Other;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends x {}\n',
      'export const x = 1;\n',
      /must be an interface, a type literal or Record<never, never>/u,
    ],
    [
      'interface Props extends x<string> {}\n',
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
  ])('refuses %j from %j', (body, option, message) => {
    const run = (): string => {
      return filled(body, option);
    };

    expect(run).toThrow(message);
  });
});
