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

describe.each(ruleDirectories)('%s', (ruleName) => {
  it('evaluates its module and exports the rule under the module\'s name', async () => {
    const module = moduleNameOf(ruleName);
    const loaded: unknown = await import(`./rules/${ruleName}/${ruleFileOf(ruleName)}.ts`);

    const expected = [module, 'create'];
    expect(loaded).toHaveProperty(expected, expect.any(Function));
  });
});
