import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { expect, it } from 'vitest';

import { catalogReader } from '../../read/catalog/catalogReader';
import { manifestReader } from '../../read/manifest/manifestReader';

import { drawersPick } from './drawersPick';

it('picks base and each answered value\'s drawer, any first', async () => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, DRAWERS_ROOT, 'react');
  const plain = drawersPick(catalog, {
    testing: 'vitest',
    form: 'none',
    store: 'redux-toolkit',
    data: 'rtk-query',
    languages: ['en'],
  });
  const tailwind = drawersPick(catalog, { styling: 'tailwind' });

  expect(plain).toEqual([
    'any/base',
    'any/data-rtk-query',
    'any/store-redux-toolkit',
    'any/testing-vitest',
    'css/form-none',
  ]);

  expect(tailwind).toEqual([
    'any/base',
    'any/styling-tailwind',
    'tailwind/base',
  ]);
});
