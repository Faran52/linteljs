import {
  describe,
  expect,
  it,
} from 'vitest';

import { moduleNameOf, ruleDirectories } from '#mocks/ruleTree';

/**
 * No rule is imported at the top, and that is the whole reason this file is not part of `meta.test.ts`. A rule that
 * throws while its module is evaluated takes every file importing it down as a failed file with no test results,
 * which Stryker reads as a surviving mutant. Imported inside the test body, it is one ordinary failure with the
 * rule's name on it.
 */
describe.each(ruleDirectories)('%s', (ruleName) => {
  it('evaluates its module and exports the rule under the module\'s name', async () => {
    const module = moduleNameOf(ruleName);
    const loaded: unknown = await import(`./rules/${ruleName}/${module}.ts`);

    expect(loaded).toHaveProperty([module, 'create'], expect.any(Function));
  });
});
