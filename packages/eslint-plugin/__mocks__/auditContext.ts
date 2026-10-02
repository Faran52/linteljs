import { Linter, type Rule } from 'eslint';
import tseslint from 'typescript-eslint';

import type { AuditContext } from '../scripts/audit/real-code/types.ts';
import type { OptionValue } from '../scripts/audit/utils/optionUtils.ts';

export const auditContext = (overrides: Partial<AuditContext> = {}): AuditContext => {
  const context: AuditContext = {
    activeRules: ['union-newline'],
    auditCounts: new Map(),
    auditVolume: [],
    configCache: new Map(),
    counts: {
      js: {
        changed: 0,
        compiled: 0,
        duplicate: 0,
        minified: 0,
        oversized: 0,
        scanned: 0,
        unparsed: 0,
      },
      ts: {
        changed: 0,
        compiled: 0,
        duplicate: 0,
        minified: 0,
        oversized: 0,
        scanned: 0,
        unparsed: 0,
      },
    },
    files: [],
    findings: [],
    fixTimes: [],
    linter: new Linter(),
    options: {},
    seen: new Set(),
    sources: [],
    timings: [],
    ...overrides,
  };

  return context;
};

export const textRule = (transform: (text: string) => string): Rule.RuleModule => {
  const rule: Rule.RuleModule = {
    meta: { fixable: 'code' },
    create: (context) => {
      const listener: Rule.RuleListener = {
        Program: (node) => {
          const text = context.sourceCode.getText();
          const fixed = transform(text);

          if (fixed !== text) {
            context.report({
              node,
              message: 'rewritten',
              fix: (fixer) => {
                return fixer.replaceTextRange([0, text.length], fixed);
              },
            });
          }
        },
      };

      return listener;
    },
  };

  return rule;
};

const orderings = (names: string[]): string[][] => {
  return names
    .flatMap((name, index) => {
      const rest = names
        .filter((_, other) => {
          return other !== index;
        });

      const extended = orderings(rest)
        .map((tail) => {
          const ordering = [name, ...tail];

          return ordering;
        });
      const fromName = [[name], ...extended];

      return fromName;
    });
};

export const configOf = (modules: Record<string, Rule.RuleModule>): Linter.Config[] => {
  const ruleEntries = Object.keys(modules)
    .map((name): [string, Linter.RuleEntry] => {
      const entry: [string, Linter.RuleEntry] = [`@linteljs/${name}`, 'error'];

      return entry;
    });

  const shared = {
    linterOptions: { reportUnusedDisableDirectives: 'off' as const },
    plugins: { '@linteljs': { rules: modules } },
    rules: Object.fromEntries(ruleEntries),
  };

  const configs: Linter.Config[] = [
    {
      ...shared,
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: { parser: tseslint.parser },
    },
    {
      ...shared,
      files: ['**/*.js', '**/*.cjs'],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
  ];

  return configs;
};

export const plantRules = (
  context: AuditContext,
  modules: Record<string, Rule.RuleModule>,
  options: Record<string, Record<string, OptionValue>> = {},
): void => {
  const ruleNames = Object.keys(modules);

  for (const names of orderings(ruleNames)) {
    const ordered = Object.entries(modules)
      .filter(([name]) => {
        return names.includes(name);
      })
      .toSorted(([left], [right]) => {
        return names.indexOf(left) - names.indexOf(right);
      });

    const orderedModules = Object.fromEntries(ordered);

    context.configCache.set(`${names.join(',')}|${JSON.stringify(options)}`, configOf(orderedModules));
  }
};

export const captured = (): (() => string) => {
  const spies = [
    vi.spyOn(console, 'log').mockReturnValue(),
    vi.spyOn(console, 'warn').mockReturnValue(),
    vi.spyOn(console, 'error').mockReturnValue(),
  ];

  return () => {
    return spies
      .flatMap((spy) => {
        return spy.mock.calls.map(String);
      })
      .join('\n');
  };
};
