import {
  ANSWERED,
  byKey,
  componentStyleGates,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  PRESSABLE,
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

import { solidTarget } from './solidTarget';

describe('solidTarget', () => {
  it('is the record the solid answer names', () => {
    expect(solidTarget.id).toBe('solid');
  });

  it('takes the solid framework layer', () => {
    expect(solidTarget.framework).toBe('solid');
  });

  it('names files the way any JSX target does', () => {
    expect(solidTarget.naming).toEqual(componentNaming());
  });

  it('admits the route segments a file-based router owns', () => {
    expect(solidTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query']),
  ['src/pages/routes.tsx', WITHOUT_FORM],
  ['src/pages/routes.tsx@with-form', WITH_FORM],
  ['src/pages/home/HomePage.tsx', WITHOUT_STORE],
  ['src/pages/home/HomePage.tsx@with-store', WITH_STORE],
  ['src/pages/contact/ContactPage.tsx', WITH_FORM],
  ['src/pages/contact/useContactForm.ts', WITH_FORM],
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
  ['src/lib/primitives/create-extended-query/createExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/primitives/create-extended-mutation/createExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/button/Button.css', PRESSABLE],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/pages/home/HomePage.test.tsx', WITHOUT_STORE],
  ['src/pages/home/HomePage.test.tsx@with-store', WITH_STORE],
  ['src/lib/primitives/create-extended-query/createExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/primitives/create-extended-mutation/createExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return solidTarget;
  }, 'solid');

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
