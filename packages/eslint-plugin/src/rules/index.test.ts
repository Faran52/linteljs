import { alphabetically } from '@mocks/fixerSamples';
import { moduleNameOf, ruleDirectories } from '@mocks/ruleTree';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from './index.ts';

describe('rules', () => {
  it('registers exactly the rules that have a directory', () => {
    const ruleIds = Object.keys(rules)
      .toSorted(alphabetically);

    expect(ruleIds).toEqual(ruleDirectories.toSorted(alphabetically));
  });

  it.each(Object.entries(rules))('registers %s as the rule its own directory exports', async (name, rule) => {
    const loaded: unknown = await import(`./${name}/${moduleNameOf(name)}.ts`);

    expect(loaded).toHaveProperty([moduleNameOf(name)], rule);
  });
});
