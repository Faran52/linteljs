import {
  byKey,
  componentStyleGates,
  type GateRow,
  mswGates,
  PRESSABLE,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { nuxtTarget } from './nuxtTarget';

describe('nuxtTarget', () => {
  it('is the record the nuxt answer names', () => {
    expect(nuxtTarget.id).toBe('nuxt');
  });

  it('writes no document and no vite config of its own', () => {
    expect(nuxtTarget.html).toBe(false);
    expect(nuxtTarget.vitePlugin).toBeUndefined();
  });
});

const GATES: GateRow[] = [
  ...mswGates(false),
  ...componentStyleGates('app-mark/AppMark', 'app-button/AppButton', true),
  ['src/lib/composables/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['../components/ui/app-button/AppButton.css', PRESSABLE],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return nuxtTarget;
  }, 'nuxt');

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
    const favicon = nuxtTarget.starterFiles.find((file) => {
      return file.target === 'public/favicon.svg';
    });

    expect(favicon).toEqual({
      target: 'public/favicon.svg',
      shared: true,
    });
  });
});
