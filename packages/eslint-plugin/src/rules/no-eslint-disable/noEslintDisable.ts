import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import { optionsOf, type RuleContext } from '../../utils/ruleUtils.ts';

interface NoEslintDisableOptions {
  allowRules: string[];
}

/**
 * The three spellings ESLint honours as a disable, longest first, and whatever follows on the same comment. The
 * lookahead keeps `eslint-disabled` and `eslint-disable-nextline` out: ESLint honours neither, so neither is a
 * directive and reporting one would be a lie about what the file does.
 *
 * Prose that opens with the word is a directive too, and reported as one. `// eslint-disable is banned` is not a
 * sentence to ESLint: it reads `is` and `banned` as rule names and fails on the first.
 */
const DIRECTIVE = /^\s*eslint-(?:disable-next-line|disable-line|disable)(?=\s|$)([\s\S]*)/;

// ESLint ends the rule list at a `--` with whitespace either side; everything after it is prose for a human.
const DESCRIPTION = /\s--\s[\s\S]*/;

const rulesNamedBy = (tail: string): string[] => {
  return tail.replace(DESCRIPTION, '').split(',').map((name) => {
    return name.trim();
  }).filter((name) => {
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
  // Report-only. Deleting the comment is a one-line fix to write and a bad one to apply: every finding it was hiding
  // arrives at once, in a file the author did not open, from a `--fix` they ran for something else.
  create: (context: RuleContext) => {
    // A Set reads an absent option as empty, so no fallback list is needed.
    const allowRules = new Set(optionsOf<NoEslintDisableOptions>(context).allowRules);

    return {
      Program: () => {
        for (const comment of sourceCodeOf(context).getAllComments()) {
          const tail = DIRECTIVE.exec(comment.value)?.[1];

          if (tail === undefined) {
            continue;
          }

          /**
           * Every rule it names has to be allowed, not one of them: a directive naming an allowed rule beside a
           * forbidden one suppresses both. A bare directive names none and is never allowed, because that is the
           * form that turns the whole file off.
           */
          const named = rulesNamedBy(tail);
          const allowed = named.length > 0 && named.every((name) => {
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
