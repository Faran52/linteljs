import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type AnswerKey } from '@answers';

import { catalogReader } from '../../read/catalog/catalogReader';
import {
  type Answered,
  manifestReader,
  type Question,
} from '../../read/manifest/manifestReader';

import { offersCheck, unmetOf } from './offersCheck';

const questionOf = async (key: AnswerKey): Promise<Question> => {
  const questions = await manifestReader();
  const [question] = questions
    .filter((candidate) => {
      return candidate.key === key;
    });

  if (question === undefined) {
    throw new Error(`no question ${key}`);
  }

  return question;
};

const offersOf = async (key: AnswerKey, answered: Answered = {}): Promise<string[]> => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'react');

  const question = await questionOf(key);

  return offersCheck(catalog, question, answered);
};

describe('offersCheck', () => {
  it.each<[AnswerKey, Answered, string[]]>([
    [
      'testing',
      {},
      ['vitest', 'none'],
    ],
    [
      'form',
      {},
      ['react-hook-form', 'none'],
    ],
    [
      'form',
      { styling: 'tailwind' },
      ['react-hook-form', 'none'],
    ],
    [
      'stories',
      {},
      [],
    ],
    [
      'data',
      {},
      ['tanstack-query', 'none'],
    ],
    [
      'data',
      { store: 'redux-toolkit' },
      [
        'tanstack-query',
        'rtk-query',
        'none',
      ],
    ],
    [
      'mocking',
      {},
      [],
    ],
    [
      'mocking',
      { data: 'none' },
      [],
    ],
    [
      'mocking',
      { data: 'tanstack-query' },
      ['msw', 'none'],
    ],
    [
      'languages',
      {},
      ['en'],
    ],
    [
      'agents',
      {},
      ['claude-code'],
    ],
    [
      'layout',
      {},
      ['single', 'monorepo'],
    ],
    [
      'typeSafety',
      {},
      ['strict', 'relaxed'],
    ],
    [
      'plugins',
      { agents: [] },
      [],
    ],
    [
      'plugins',
      { agents: ['claude-code'] },
      [
        'ponytail',
        'context7',
        'frontend-design',
      ],
    ],
  ])('offers %s after %j as %j', async (key, answered, expected) => {
    const actual = await offersOf(key, answered);

    expect(actual).toEqual(expected);
  });
});

describe('unmetOf', () => {
  it('names the answer a value needs and is not given', async () => {
    const data = await questionOf('data');
    const unmet = unmetOf(data, 'rtk-query', { store: 'zustand' });
    const met = unmetOf(data, 'rtk-query', { store: 'redux-toolkit' });
    const free = unmetOf(data, 'tanstack-query', {});

    expect([
      unmet,
      met,
      free,
    ]).toEqual([
      'store',
      undefined,
      undefined,
    ]);
  });
});
