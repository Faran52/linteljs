import {
  ANSWERED,
  byKey,
  componentStyleGates,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  PRESSABLE,
  RTK_QUERY,
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
import { componentNaming } from '../utils/namingUtils';

import { nextTarget } from './nextTarget';

describe('nextTarget', () => {
  it('is the record the next answer names', () => {
    expect(nextTarget.id).toBe('next');
  });

  it('owns its document rather than writing one', () => {
    expect(nextTarget.html).toBe(false);
    expect(nextTarget.htmlEntry).toBeUndefined();
  });

  it('carries no vite build', () => {
    expect(nextTarget.vitePlugin).toBeUndefined();
    expect(nextTarget.build).toBe('next build');
  });

  it('names files the way any JSX target does', () => {
    expect(nextTarget.naming).toEqual(componentNaming('app'));
  });

  it('admits the route segments a file-based router owns', () => {
    expect(nextTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query', 'rtk-query']),
  ['.babelrc@stylex', STYLEX],
  ['postcss.config.mjs@stylex', STYLEX],
  ['postcss.config.mjs@tailwind', TAILWIND],
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/app/page.tsx', WITHOUT_STORE],
  ['src/app/page.tsx@with-store', WITH_STORE],
  ['src/app/contact/page.tsx', WITH_FORM],
  ['src/app/contact/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/app/contact/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ['src/components/ui/index.ts', [{
    store: [undefined],
    form: [undefined],
  }]],
  ['src/components/ui/index.ts@with-store', [{
    store: ANSWERED,
    form: [undefined],
  }]],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/button/Button.tsx', PRESSABLE],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/lib/apis/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/StoreProvider.tsx', [{ store: [undefined, 'zustand', 'tanstack-store'] }]],
  ['src/lib/providers/StoreProvider.tsx@redux-toolkit', [{ store: ['redux-toolkit'] }]],
  ['src/lib/store/counter.ts@zustand', [{ store: ['zustand'] }]],
  ['src/lib/store/counter.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/lib/store/counter.ts@redux-toolkit', [{
    store: ['redux-toolkit'],
    data: [undefined, 'tanstack-query'],
  }]],
  ['src/lib/store/counter.ts@rtk-query', [{
    store: ['redux-toolkit'],
    data: ['rtk-query'],
  }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['../components/ui/button/Button.css', PRESSABLE],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/app/page.test.tsx', WITHOUT_STORE],
  ['src/app/page.test.tsx@with-store', WITH_STORE],
  ['src/lib/apis/baseApi.test.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return nextTarget;
  }, 'next');

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
