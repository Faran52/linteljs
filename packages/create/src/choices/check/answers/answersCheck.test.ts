import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { expect, it } from 'vitest';

import { Refused } from '../../errors/refused/refusedError';
import { catalogReader } from '../../read/catalog/catalogReader';
import {
  type Answered,
  manifestReader,
  type Question,
} from '../../read/manifest/manifestReader';

import { answersCheck } from './answersCheck';

const checkedFor = async (given: Answered): Promise<Answered> => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'react');

  return answersCheck(questions, catalog, given);
};

it('fills each asked question with its offered default and skips the unasked', async () => {
  const actual = await checkedFor({ target: 'react' });

  expect(actual).toEqual({
    target: 'react',
    layout: 'single',
    testing: 'vitest',
    styling: 'none',
    form: 'none',
    store: 'none',
    data: 'none',
    languages: [],
    agents: ['claude-code'],
    plugins: [
      'ponytail',
      'context7',
      'frontend-design',
    ],
    typeSafety: 'strict',
  });
});

it('takes the first offer for a choice whose default is not offered', async () => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'react');
  const layouts = questions
    .filter((question) => {
      return question.key === 'layout';
    })
    .map((question) => {
      const moved: Question = {
        ...question,
        default: 'gone',
      };

      return moved;
    });
  const actual = answersCheck(layouts, catalog, {});

  expect(actual).toEqual({ layout: 'single' });
});

it('keeps what is given and offered', async () => {
  const actual = await checkedFor({
    store: 'redux-toolkit',
    data: 'rtk-query',
    mocking: 'msw',
    agents: [],
  });

  expect(actual).toMatchObject({
    store: 'redux-toolkit',
    data: 'rtk-query',
    mocking: 'msw',
    agents: [],
  });

  expect(actual).not.toHaveProperty('plugins');
});

it.each<[string, Answered, RegExp]>([
  [
    'a value whose requirement is unmet',
    { data: 'rtk-query' },
    /--data rtk-query needs a store answer/u,
  ],
  [
    'a value the framework lacks',
    { testing: 'jest' },
    /--testing jest is not offered here; pick from: vitest, none/u,
  ],
  [
    'an unasked question',
    { stories: 'storybook' },
    /--stories is not asked here/u,
  ],
  [
    'a list for a choice',
    { form: ['none'] },
    /--form takes one value/u,
  ],
  [
    'one value for a multi',
    { languages: 'en' },
    /--languages takes a list/u,
  ],
])('refuses %s', async (_name, given, message) => {
  const checking = checkedFor(given);

  await expect(checking).rejects.toThrow(Refused);
  await expect(checking).rejects.toThrow(message);
});
