import { alphabetically } from '@mocks/fixerSamples';
import {
  moduleNameOf,
  ruleDirectories,
  ruleFileOf,
} from '@mocks/ruleTree';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from './registry.ts';

describe('rules', () => {
  it('registers exactly the rules that have a directory', () => {
    const ruleIds = Object.keys(rules)
      .toSorted(alphabetically);

    expect(ruleIds).toEqual(ruleDirectories.toSorted(alphabetically));
  });

  const registered = Object.entries(rules);

  it.each(registered)('registers %s as the rule its own directory exports', async (name, rule) => {
    const loaded: unknown = await import(`./${name}/${ruleFileOf(name)}.ts`);

    const expected = [moduleNameOf(name)];
    expect(loaded).toHaveProperty(expected, rule);
  });
});
