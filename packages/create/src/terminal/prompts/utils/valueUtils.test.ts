import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { assertAnswers, offeredValuesOf } from './valueUtils';

const refused = (): boolean => {
  return false;
};

describe('offeredValuesOf', () => {
  it('offers every value its own predicate allows, in record order', () => {
    const target = targetFor(DEFAULT_ANSWERS);
    const record = {
      key: 'demo',
      values: {
        open: { label: 'Open' },
        shut: {
          label: 'Shut',
          only: refused,
        },
        kept: {
          label: 'Kept',
          only: () => {
            return true;
          },
        },
      },
    };

    const offered = offeredValuesOf(record, target, DEFAULT_ANSWERS);

    expect(offered).toStrictEqual(['open', 'kept']);
  });

  it('throws when a record offers the target nothing', () => {
    const target = targetFor(DEFAULT_ANSWERS);
    const record = {
      key: 'demo',
      values: {
        shut: {
          label: 'Shut',
          only: refused,
        },
      },
    };

    const offering = () => {
      return offeredValuesOf(record, target, DEFAULT_ANSWERS);
    };

    expect(offering).toThrow(new Error('demo offers no value to react'));
  });
});

describe('assertAnswers', () => {
  it.each([
    ['the defaults', {}],
    ['an optional choice', { store: 'zustand' }],
    ['a multi of its values', { libraries: ['zod'] }],
    ['an optional multi', { languages: ['ja'] }],
    ['a list of strings', { ignores: ['dist'] }],
    ['a map of strings', { aliases: { '@app': 'src' } }],
    ['a text', { nodeVersion: '26' }],
  ])('passes %s', (_case, answered) => {
    const answers = {
      ...DEFAULT_ANSWERS,
      ...answered,
    };

    const asserting = () => {
      assertAnswers(answers);
    };

    expect(asserting).not.toThrow();
  });

  it.each([
    [
      'a choice outside its values',
      { target: 'cobol' },
      'target is not a value its record allows: "cobol"',
    ],
    [
      'a choice that is no string',
      { layout: 1 },
      'layout is not a value its record allows: 1',
    ],
    [
      'a multi that is no array',
      { libraries: 'zod' },
      'libraries is not a value its record allows: "zod"',
    ],
    [
      'a multi with a stray value',
      { agents: ['hal'] },
      'agents is not a value its record allows: ["hal"]',
    ],
    [
      'an optional choice outside its values',
      { store: 'vuex' },
      'store is not a value its record allows: "vuex"',
    ],
    [
      'a list with a number',
      { ignores: [1] },
      'ignores is not a value its record allows: [1]',
    ],
    [
      'a map that is no object',
      { aliases: 'src' },
      'aliases is not a value its record allows: "src"',
    ],
    [
      'a map with a number',
      { aliases: { '@app': 1 } },
      'aliases is not a value its record allows: {"@app":1}',
    ],
    [
      'a text that is no string',
      { nodeVersion: 26 },
      'nodeVersion is not a value its record allows: 26',
    ],
  ])('throws on %s', (_case, answered, message) => {
    const answers = {
      ...DEFAULT_ANSWERS,
      ...answered,
    };

    const asserting = () => {
      assertAnswers(answers);
    };

    expect(asserting).toThrow(new Error(message));
  });

  it('throws on a required answer left out', () => {
    const asserting = () => {
      assertAnswers({});
    };

    expect(asserting).toThrow(new Error('target is not a value its record allows: undefined'));
  });
});
