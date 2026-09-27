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

import { angularTarget } from './angularTarget';

describe('angularTarget', () => {
  it('is the record the angular answer names', () => {
    expect(angularTarget.id).toBe('angular');
  });

  it('has its project file written rather than copied', () => {
    expect(angularTarget.angularProject).toBe(true);
    expect(angularTarget.build).toBe('ng build');
  });

  it('names every module the way the CLI would, and leaves declarations to their own key', () => {
    expect(angularTarget.naming['src/**/!(*.d).ts']).toBe('KEBAB_CASE');
    expect(angularTarget.naming).not.toHaveProperty('src/**/*.ts');
    expect(angularTarget.naming['src/**/*.d.ts']).toBeDefined();
  });
});

const GATES: GateRow[] = [
  ...mswGates(false),
  ...componentStyleGates('mark/Mark', 'button/Button', false),
  ['src/lib/services/extended-query/extended-query.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/button/Button.css', PRESSABLE],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/services/extended-query/extended-query.spec.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.spec.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return angularTarget;
  }, 'angular');

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
