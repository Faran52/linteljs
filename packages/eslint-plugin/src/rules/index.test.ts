import { moduleNameOf, ruleDirectories } from '@mocks/ruleTree';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from './index.ts';

const alphabetically = (values: string[]): string[] => {
  return values.toSorted((left, right) => {
    return left.localeCompare(right);
  });
};

describe('rules', () => {
  // Both sorted lists, so a rule with no directory and a directory nothing registers both fail.
  it('registers exactly the rules that have a directory', () => {
    expect(alphabetically(Object.keys(rules))).toEqual(alphabetically(ruleDirectories));
  });

  // The id is the directory, so an entry wired to a sibling's module is a rule published under the wrong name.
  it.each(Object.entries(rules))('registers %s as the rule its own directory exports', async (name, rule) => {
    const loaded: unknown = await import(`./${name}/${moduleNameOf(name)}.ts`);

    expect(loaded).toHaveProperty([moduleNameOf(name)], rule);
  });
});
