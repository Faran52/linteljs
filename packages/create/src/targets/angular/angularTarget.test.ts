import {
  byKey,
  type GateRow,
  mswGates,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITHOUT_FORM,
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
  ['src/lib/services/extended-query/extended-query.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['.postcssrc.json@tailwind', TAILWIND],
  ['src/app/contact/contact.ts', WITHOUT_FORM],
  ['src/app/contact/contact.html', WITHOUT_FORM],
  ['src/app/contact/contact.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/app/contact/contact.html@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/lib/apis/contact/schemas.ts', [{ libraries: [[]] }]],
  ['src/lib/apis/contact/schemas.ts@zod', [{ libraries: [['zod']] }]],
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
