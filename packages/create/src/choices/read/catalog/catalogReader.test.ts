import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { expect, it } from 'vitest';

import { type AnswerKey } from '@answers';

import { manifestReader, type Question } from '../manifest/manifestReader';

import { catalogReader } from './catalogReader';

it('reads each directory\'s drawers and the common languages and agents', async () => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'demo');
  const names = catalog.drawers
    .map((drawer) => {
      return `${drawer.dir}/${drawer.name}=${drawer.value}`;
    });

  expect(names).toEqual([
    'any/base=',
    'any/data-rtk-query=rtk-query',
    'any/data-tanstack-query=tanstack-query',
    'any/form-react-hook-form=react-hook-form',
    'any/mocking-msw=msw',
    'any/store-redux-toolkit=redux-toolkit',
    'any/styling-tailwind=tailwind',
    'any/testing-none=none',
    'any/testing-vitest=vitest',
    'css/form-none=none',
    'tailwind/base=',
  ]);

  expect([catalog.languages, catalog.agents]).toEqual([['en'], ['claude-code']]);
});

it('reads a drawer by the longest question it starts with', async () => {
  const keys: AnswerKey[] = ['packageManager', 'packageManagerVersion'];
  const questions = keys
    .map((key) => {
      const question: Question = {
        key,
        flag: key,
        prompt: key,
        kind: 'choice',
        scope: 'workspace',
        default: '11',
        values: { 11: { label: '11' } },
      };

      return question;
    });
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'prefix');

  expect(catalog.drawers).toEqual([{
    dir: 'any',
    name: 'package-manager-version-11',
    key: 'packageManagerVersion',
    value: '11',
  }]);
});

it.each([
  ['no-question', /colour-red names no question/u],
  ['no-value', /form-formik names no question and value/u],
])('throws on a drawer in %s', async (framework, message) => {
  const questions = await manifestReader();

  const reading = catalogReader(questions, DRAWERS_ROOT, framework);

  await expect(reading).rejects.toThrow(message);
});
