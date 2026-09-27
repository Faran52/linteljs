import { moduleNameOf, ruleDirectories } from '@mocks/ruleTree';
import {
  describe,
  expect,
  it,
} from 'vitest';

describe.each(ruleDirectories)('%s', (ruleName) => {
  it('evaluates its module and exports the rule under the module\'s name', async () => {
    const module = moduleNameOf(ruleName);
    const loaded: unknown = await import(`./rules/${ruleName}/${module}.ts`);

    expect(loaded).toHaveProperty([module, 'create'], expect.any(Function));
  });
});
