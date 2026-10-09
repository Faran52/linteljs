import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { expect, it } from 'vitest';

import { localesWriter } from './localesWriter';

it('folds the namespaces into one common.json per language', async () => {
  const locales = await localesWriter(DRAWERS_ROOT, ['en'], ['app', 'nav']);
  const strings = {
    title: 'Demo',
    home: 'Home',
  };
  const expected = [
    {
      path: 'en/common.json',
      text: `${JSON.stringify(strings, null, 2)}\n`,
    },
  ];

  expect(locales).toEqual(expected);
});

it('refuses a namespace a language lacks', async () => {
  const writing = localesWriter(DRAWERS_ROOT, ['en'], ['missing']);

  await expect(writing).rejects.toThrow('missing.json is missing or not an object');
});
