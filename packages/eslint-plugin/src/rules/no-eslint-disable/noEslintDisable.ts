import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  createRule,
  optionsOf,
  type RuleContext,
} from '../../utils/ruleUtils.ts';

interface NoEslintDisableOptions {
  allowRules: string[];
}

// The lookahead keeps `eslint-disabled` and `eslint-disable-nextline` out: ESLint honours neither.
const DIRECTIVE = /^\s*eslint-(?:disable-next-line|disable-line|disable)(?=\s|$)([\s\S]*)/;

// ESLint ends the rule list at a `--` with whitespace either side; everything after it is prose for a human.
const DESCRIPTION = /\s--\s[\s\S]*/;

const rulesNamedBy = (tail: string): string[] => {
  return tail
    .replace(DESCRIPTION, '')
    .split(',')
    .map((name) => {
      return name.trim();
    })
    .filter((name) => {
      return name !== '';
    });
};

export const noEslintDisable = createRule('no-eslint-disable', {
  meta: {
    type: 'problem',
    docs: {
      language: 'universal',
      recommended: true,
      description: 'Fix what a rule reports, or name the exemption in the config. Do not disable it inline.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowRules: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noDisable: 'Remove this directive. Fix what the rule reports, or name the exemption in the ESLint config.',
    },
  },
  // Report-only: deleting the comment releases every hidden finding at once, in a file nobody opened.
  create: (context: RuleContext) => {
    const allowRules = new Set(optionsOf<NoEslintDisableOptions>(context).allowRules);

    return {
      Program: () => {
        for (const comment of sourceCodeOf(context).getAllComments()) {
          const tail = DIRECTIVE.exec(comment.value)?.[1];

          if (tail === undefined) {
            continue;
          }

          // A directive naming an allowed rule beside a forbidden one suppresses both.
          const named = rulesNamedBy(tail);
          const allowed = named.length > 0 && named
            .every((name) => {
              return allowRules.has(name);
            });

          if (!allowed) {
            context.report({
              node: comment,
              messageId: 'noDisable',
            });
          }
        }
      },
    };
  },
});
