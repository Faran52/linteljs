import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Rule } from 'eslint';

// Every member optional so the test fails on whichever one is missing; `create` is typed off
// ESLint's own rule module rather than `unknown`, since the test reads it back.
interface LoadedRule {
  meta?: {
    docs?: {
      description?: string;
      category?: string;
      language?: string;
      recommended?: boolean;
    };
    messages?: Record<string, string>;
  };
  create?: Rule.RuleModule['create'];
}

// `import()` on a computed path returns `any`, so the namespace comes back `unknown`, narrowed
// here by a guard rather than a generic unknown-in/unknown-out helper.
const isNamespace = (loaded: unknown): loaded is object => {
  return typeof loaded === 'object' && loaded !== null;
};

const isRuleModule = (value: unknown): value is LoadedRule => {
  return typeof value === 'object'
    && value !== null
    && 'create' in value
    && typeof value.create === 'function';
};

// Nothing here is imported at the top on purpose: a malformed rule module would throw at import time and
// take the whole file down at zero failures; importing inside the test body turns that into one ordinary failure.

const RULE_MODULES = [
  'comment-delimiter',
  'destructuring-property-newline',
  'export-specifier-newline',
  'import-newlines',
  'interface-order',
  'newline-destructuring',
  'no-duplicate-jsx-props',
  'no-import-namespace-destructure',
  'prefer-arrow-functions',
  'prefer-await-to-then',
  'prefer-destructured-props',
  'prefer-try-catch',
  'sort-hook-dependencies',
  'union-newline',
];

describe.each(RULE_MODULES)('%s', (moduleName) => {
  it('builds a complete rule when its module is evaluated', async () => {
    const loaded: unknown = await import(`./rules/${moduleName}/index.ts`);
    const rule = isNamespace(loaded) ? Object.values(loaded).find(isRuleModule) : undefined;

    if (!rule) {
      throw new Error(`${moduleName}/index.ts exports no rule`);
    }

    // Each of these is `createRule`'s responsibility to produce, so a malformed definition
    // fails here rather than downstream.
    expect(typeof rule.create).toBe('function');
    expect(rule.meta?.docs?.description).toBeTruthy();
    expect(rule.meta?.docs?.category).toBeTruthy();
    expect(rule.meta?.docs?.language).toBeTruthy();
    expect(typeof rule.meta?.docs?.recommended).toBe('boolean');
    expect(Object.keys(rule.meta?.messages ?? {}).length).toBeGreaterThan(0);
  });
});

describe('the registry', () => {
  it('exports every rule module listed here and no others', async () => {
    const { rules } = await import('./rules/index.ts');

    // `localeCompare` avoids UTF-16 ordering, and `toSorted` avoids reordering either array in place.
    const byName = (left: string, right: string): number => {
      return left.localeCompare(right);
    };

    expect(Object.keys(rules).toSorted(byName)).toEqual(RULE_MODULES.toSorted(byName));
  });
});
