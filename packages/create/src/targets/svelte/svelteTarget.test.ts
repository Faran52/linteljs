import {
  ANSWERED,
  byKey,
  componentStyleGates,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  STYLEX,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_STORE,
  WITHOUT_FORM,
  WITHOUT_STORE,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { sfcNaming } from '../utils/namingUtils';

import { svelteTarget } from './svelteTarget';

describe('svelteTarget', () => {
  it('is the record the svelte answer names', () => {
    expect(svelteTarget.id).toBe('svelte');
  });

  it('names the style entry the root layout imports', () => {
    expect(svelteTarget.styleEntry).toBe('src/app.css');
  });

  it('writes no html entry of its own', () => {
    expect(svelteTarget.htmlEntry).toBeUndefined();
  });

  it('names files the way any SFC target does', () => {
    expect(svelteTarget.naming).toEqual(sfcNaming('svelte', 'routes'));
  });

  it('admits the route segments a file-based router owns', () => {
    expect(svelteTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query']),
  ['src/routes/+layout.svelte', [{ styling: [undefined, 'tailwind'] }]],
  ['src/routes/+layout.svelte@stylex', STYLEX],
  ['__mocks__/WithData.svelte', [{
    form: ANSWERED,
    testing: ['vitest'],
  }]],
  ['__mocks__/WithExtendedQuery.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/WithExtendedMutation.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/ExtendedQueryProbe.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/ExtendedMutationProbe.svelte@tanstack-query', TANSTACK_QUERY],
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/routes/+page.svelte', WITHOUT_STORE],
  ['src/routes/+page.svelte@with-store', WITH_STORE],
  ['src/routes/contact/+page.svelte', WITH_FORM],
  ['src/routes/contact/useContactForm.ts', WITH_FORM],
  ['src/components/ui/text-input/TextInput.svelte', WITH_FORM],
  ['src/components/ui/text-input/types.ts', WITH_FORM],
  ['src/lib/hooks/create-extended-query/createExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/create-extended-mutation/createExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.svelte', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.svelte@tanstack-query', TANSTACK_QUERY],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/routes/page.test.ts', WITHOUT_STORE],
  ['src/routes/page.test.ts@with-store', WITH_STORE],
  ['src/lib/hooks/create-extended-query/createExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/create-extended-mutation/createExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return svelteTarget;
  }, 'svelte');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const favicon = svelteTarget.starterFiles.find((file) => {
      return file.target === 'static/favicon.svg';
    });

    expect(favicon).toEqual({
      target: 'static/favicon.svg',
      shared: true,
      source: 'public/favicon.svg',
    });
  });
});
