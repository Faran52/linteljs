import { Linter, type Rule } from 'eslint';
import tseslint from 'typescript-eslint';

import type { AuditContext } from '../scripts/audit/real-code/types.ts';
import type { OptionValue } from '../scripts/audit/utils/optionUtils.ts';

export const auditContext = (overrides: Partial<AuditContext> = {}): AuditContext => {
  return {
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
};

export const textRule = (transform: (text: string) => string): Rule.RuleModule => {
  return {
    meta: { fixable: 'code' },
    create: (context) => {
      return {
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
    },
  };
};

const orderings = (names: string[]): string[][] => {
  return names
    .flatMap((name, index) => {
      const rest = names
        .filter((_, other) => {
          return other !== index;
        });

      return [[name], ...orderings(rest)
        .map((tail) => {
          return [name, ...tail];
        })];
    });
};

export const configOf = (modules: Record<string, Rule.RuleModule>): Linter.Config[] => {
  const ruleEntries = Object.keys(modules)
    .map((name): [string, Linter.RuleEntry] => {
      return [`@linteljs/${name}`, 'error'];
    });

  const shared = {
    linterOptions: { reportUnusedDisableDirectives: 'off' as const },
    plugins: { '@linteljs': { rules: modules } },
    rules: Object.fromEntries(ruleEntries),
  };

  return [
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
};

export const plantRules = (
  context: AuditContext,
  modules: Record<string, Rule.RuleModule>,
  options: Record<string, Record<string, OptionValue>> = {},
): void => {
  for (const names of orderings(Object.keys(modules))) {
    const ordered = Object.entries(modules)
      .filter(([name]) => {
        return names.includes(name);
      })
      .toSorted(([left], [right]) => {
        return names.indexOf(left) - names.indexOf(right);
      });

    context.configCache.set(`${names.join(',')}|${JSON.stringify(options)}`, configOf(Object.fromEntries(
      ordered,
    )));
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
