import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Catalog } from '@choices/read/catalog/catalogReader';
import { type Question } from '@choices/read/manifest/manifestReader';
import { type Prompter } from '@terminal';

import { Cancelled } from '../../errors/cancelled/cancelledError';

import { questionsAsk } from './questionsAsk';

type SelectRequest = Parameters<Prompter['select']>[0];

type MultiSelectRequest = Parameters<Prompter['multiselect']>[0];

interface Asked {
  prompter: Prompter;
  selects: SelectRequest[];
  multiselects: MultiSelectRequest[];
}

const CANCEL = Symbol('cancel');

const QUESTIONS: Question[] = [
  {
    key: 'target',
    flag: 'target',
    prompt: 'Framework',
    kind: 'choice',
    scope: 'project',
    default: 'react',
    values: {
      react: { label: 'React' },
      vue: {
        label: 'Vue',
        hint: 'progressive',
      },
    },
  },
  {
    key: 'testing',
    flag: 'testing',
    prompt: 'Testing',
    kind: 'choice',
    scope: 'project',
    default: 'jest',
    none: { label: 'No tests' },
    values: {
      vitest: { label: 'Vitest' },
      jest: {
        label: 'Jest',
        requires: { target: 'react' },
      },
    },
  },
  {
    key: 'form',
    flag: 'form',
    prompt: 'Forms',
    kind: 'choice',
    scope: 'project',
    default: 'none',
    none: { label: 'No forms' },
    values: { formik: { label: 'Formik' } },
  },
  {
    key: 'languages',
    flag: 'languages',
    prompt: 'Languages',
    kind: 'multi',
    scope: 'workspace',
    default: ['en', 'fr'],
    values: {
      en: { label: 'English' },
      fr: { label: 'French' },
      de: { label: 'German' },
    },
  },
];

const CATALOG: Catalog = {
  drawers: [
    {
      dir: 'any',
      name: 'testing-vitest',
      key: 'testing',
      value: 'vitest',
    },
    {
      dir: 'any',
      name: 'testing-jest',
      key: 'testing',
      value: 'jest',
    },
  ],
  languages: ['en', 'de'],
  agents: [],
};

// Picks each select's initial value and each multiselect's initial values, or cancels at `cancelAt`.
const askedWith = (cancelAt?: string): Asked => {
  const selects: SelectRequest[] = [];
  const multiselects: MultiSelectRequest[] = [];
  const prompter: Prompter = {
    select: async (request) => {
      selects.push(request);

      return await Promise.resolve(request.message === cancelAt ? CANCEL : request.initialValue);
    },
    multiselect: async (request) => {
      multiselects.push(request);

      return await Promise.resolve(request.message === cancelAt ? CANCEL : request.initialValues);
    },
    text: async () => {
      return await Promise.resolve(CANCEL);
    },
    isCancel: (value): value is symbol => {
      return value === CANCEL;
    },
  };

  const asked: Asked = {
    prompter,
    selects,
    multiselects,
  };

  return asked;
};

describe('questionsAsk', () => {
  it('asks the offered questions in manifest order with their defaults', async () => {
    const {
      prompter,
      selects,
      multiselects,
    } = askedWith();

    const answered = await questionsAsk(prompter, QUESTIONS, CATALOG, {});

    expect(answered).toStrictEqual({
      target: 'react',
      testing: 'jest',
      languages: ['en'],
    });

    expect(selects).toStrictEqual([
      {
        message: 'Framework',
        initialValue: 'react',
        options: [
          {
            value: 'react',
            label: 'React',
          },
          {
            value: 'vue',
            label: 'Vue',
            hint: 'progressive',
          },
        ],
      },
      {
        message: 'Testing',
        initialValue: 'jest',
        options: [
          {
            value: 'vitest',
            label: 'Vitest',
          },
          {
            value: 'jest',
            label: 'Jest',
          },
          {
            value: 'none',
            label: 'No tests',
          },
        ],
      },
    ]);

    expect(multiselects).toStrictEqual([
      {
        message: 'Languages',
        initialValues: ['en'],
        required: false,
        options: [
          {
            value: 'en',
            label: 'English',
          },
          {
            value: 'de',
            label: 'German',
          },
        ],
      },
    ]);
  });

  it('keeps a given answer unasked and offers by it', async () => {
    const { prompter, selects } = askedWith();

    const answered = await questionsAsk(prompter, QUESTIONS, CATALOG, {
      target: 'vue',
      languages: [],
    });
    const messages = selects
      .map((request) => {
        return request.message;
      });

    expect(answered).toStrictEqual({
      target: 'vue',
      testing: 'vitest',
      languages: [],
    });

    expect(messages).toStrictEqual(['Testing']);
  });

  it.each(['Framework', 'Languages'])('throws Cancelled when %s is cancelled', async (message) => {
    const { prompter } = askedWith(message);

    const asking = questionsAsk(prompter, QUESTIONS, CATALOG, {});

    await expect(asking).rejects.toThrow(new Cancelled('Cancelled: nothing was written.'));
  });
});
