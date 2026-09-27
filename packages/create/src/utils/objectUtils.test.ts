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
    ['an array', []],
    ['a parsed array', JSON.parse('[1, 2]')],
    ['a class instance', new Error('boom')],
    ['a map', new Map()],
    ['a null-prototype object', Object.create(null)],
  ])('refuses %s', (_case, value) => {
    expect(isJsonObject(value)).toBe(false);
  });
});

describe('valuesOf', () => {
  it('answers the keys a record carries, in the order it declares them', () => {
    const values = valuesOf({
      react: 'React',
      vue: 'Vue',
    });

    expect(values).toEqual(['react', 'vue']);
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
