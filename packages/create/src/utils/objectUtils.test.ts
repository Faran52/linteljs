import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isJsonObject,
  isValueOf,
  keysOf,
  parsedAs,
} from './objectUtils';

describe('isJsonObject', () => {
  it.each([
    ['an object', {}],
    ['an object with keys', { name: 'demo' }],
    ['a parsed object', JSON.parse('{ "a": 1 }')],
    ['a null-prototype object', Object.create(null)],
  ])('takes %s', (_case, value) => {
    const valueIsJsonObject = isJsonObject(value);
    expect(valueIsJsonObject).toBe(true);
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
  ])('refuses %s', (_case, value) => {
    const valueIsJsonObject = isJsonObject(value);
    expect(valueIsJsonObject).toBe(false);
  });
});

describe('keysOf', () => {
  it('answers the keys a record carries, in the order it declares them', () => {
    const values = keysOf({
      react: 'React',
      vue: 'Vue',
    });

    const expected = ['react', 'vue'];
    expect(values).toEqual(expected);
  });
});

describe('isValueOf', () => {
  const MANAGERS = {
    pnpm: 'pnpm',
    yarn: 'yarn',
  };

  it('takes a key the record carries', () => {
    const pnpmIsValueOf = isValueOf('pnpm', MANAGERS);
    expect(pnpmIsValueOf).toBe(true);
  });

  it('refuses a name the record does not carry', () => {
    const denoIsValueOf = isValueOf('deno', MANAGERS);
    expect(denoIsValueOf).toBe(false);
  });

  it.each(['toString', 'constructor'])('refuses %s, which every object inherits', (name) => {
    const nameIsValueOf = isValueOf(name, MANAGERS);
    expect(nameIsValueOf).toBe(false);
  });
});

describe('parsedAs', () => {
  const isList = (value: unknown): value is string[] => {
    return Array.isArray(value);
  };

  it('answers the parsed value the guard accepts', () => {
    const actual = parsedAs('["a"]', isList);
    const expected = ['a'];
    expect(actual).toEqual(expected);
  });

  it.each([
    ['a value the guard refuses', '{}'],
    ['text that is not JSON', '{'],
    ['no file', null],
  ])('answers null for %s', (_label, text) => {
    const actual = parsedAs(text, isList);
    expect(actual).toBeNull();
  });
});
