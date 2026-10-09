import { expect, it } from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { CONFIG_SCHEMA_URL_V1 } from '@answers/constants';

import { configRecord } from '../../record/config/configRecord';

import { ordersReader } from './ordersReader';

it('reads one order per project, a single layout\'s named for the repository', () => {
  const text = configRecord([{
    name: 'app',
    answers: { target: 'vue' },
  }]);
  const orders = ordersReader(text, 'repo');

  expect(orders).toEqual([{
    name: 'repo',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'vue',
    },
  }]);
});

it('keeps a monorepo project\'s own name', () => {
  const text = configRecord([{
    name: 'web',
    answers: {
      target: 'react',
      layout: 'monorepo',
    },
  }]);
  const [order] = ordersReader(text, 'repo');

  expect(order?.name).toBe('web');
});

it('migrates a version-one config', () => {
  const text = JSON.stringify({
    $schema: CONFIG_SCHEMA_URL_V1,
    ...DEFAULT_ANSWERS,
    target: 'react-native',
    testing: 'vitest',
    schemaVersion: 1,
  });
  const [order] = ordersReader(text, 'repo');

  expect(order?.answers.testing).toBe('jest');
});
