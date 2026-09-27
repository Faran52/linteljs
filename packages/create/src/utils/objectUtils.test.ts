import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isJsonObject,
  isValueOf,
  parsedAs,
  valuesOf,
} from './objectUtils';

/**
 * Five guards in four rings read off this one, and each declares its own narrowed shape, so none of their suites
 * can reach the clauses here: a `package.json` test feeds a `package.json`. The clauses are pinned once, here.
 */
describe('isJsonObject', () => {
  it.each([
    ['an object', {}],
    ['an object with keys', { name: 'demo' }],
    ['a parsed object', JSON.parse('{ "a": 1 }')],
  ])('takes %s', (_case, value) => {
    expect(isJsonObject(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'nope'],
    ['a number', 7],
    ['a boolean', true],
    // The one every caller cares about: `JSON.parse` answers an array for a file whose top level is a list, and
    // every shape below reads properties off what this admits.
    ['an array', []],
    ['a parsed array', JSON.parse('[1, 2]')],
    // Not from JSON, but these guards also see values built in code, and a class instance is not a record.
    ['a class instance', new Error('boom')],
    ['a map', new Map()],
    ['a null-prototype object', Object.create(null)],
  ])('refuses %s', (_case, value) => {
    expect(isJsonObject(value)).toBe(false);
  });
});

describe('valuesOf', () => {
  it('answers the keys a record carries, in the order it declares them', () => {
    expect(valuesOf({
      react: 'React',
      vue: 'Vue',
    })).toEqual(['react', 'vue']);
  });
});

describe('isValueOf', () => {
  const MANAGERS = {
    pnpm: 'pnpm',
    yarn: 'yarn',
  };

  it('takes a key the record carries', () => {
    expect(isValueOf('pnpm', MANAGERS)).toBe(true);
  });

  it('refuses a name the record does not carry', () => {
    expect(isValueOf('deno', MANAGERS)).toBe(false);
  });

  it.each(['toString', 'constructor'])('refuses %s, which every object inherits', (name) => {
    expect(isValueOf(name, MANAGERS)).toBe(false);
  });
});

describe('parsedAs', () => {
  const isList = (value: unknown): value is string[] => {
    return Array.isArray(value);
  };

  it('answers the parsed value the guard accepts', () => {
    expect(parsedAs('["a"]', isList)).toEqual(['a']);
  });

  it.each([
    ['a value the guard refuses', '{}'],
    ['text that is not JSON', '{'],
    ['no file', null],
  ])('answers null for %s', (_label, text) => {
    expect(parsedAs(text, isList)).toBeNull();
  });
});
