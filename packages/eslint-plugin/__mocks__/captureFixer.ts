import { Linter, type Rule } from 'eslint';

import type { Fixer } from '../src/utils/ruleUtils.ts';

// Captured rather than stubbed, since a stub would test the stub.
export const captureFixer = (): Fixer => {
  let captured: Fixer | undefined;

  const capture: Rule.RuleModule = {
    meta: { fixable: 'whitespace' },
    create: (context) => {
      const listener: Rule.RuleListener = {
        Identifier: (node) => {
          context.report({
            node,
            message: 'probe',
            fix: (fixer) => {
              captured = fixer;

              return null;
            },
          });
        },
      };

      return listener;
    },
  };

  new Linter().verify('const alpha = 1;\n', [
    {
      plugins: { probe: { rules: { capture } } },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: { 'probe/capture': 'error' },
    },
  ]);

  if (!captured) {
    throw new Error('no fixer captured');
  }

  return captured;
};
