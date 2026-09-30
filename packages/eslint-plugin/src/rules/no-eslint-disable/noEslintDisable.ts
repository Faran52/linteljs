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

// `/* eslint rule: "off" */`: only a block comment is read, and `eslint-env` and the rest fail the lookahead.
const INLINE_CONFIG = /^\s*eslint(?=\s)([\s\S]*)/;

const OFF_SEVERITY = /^\s*(?:\[\s*)?(?:"off"|'off'|0)\s*(?:[,\]]|$)/;

// Split at the commas outside strings and brackets, so an option object's own `key: 0` is not an entry.
const topLevelEntries = (text: string): string[] => {
  const entries: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);

    if (quote !== '') {
      quote = char === quote ? '' : quote;
    }
    else if (char === '"' || char === "'") {
      quote = char;
    }
    else if (char === '[' || char === '{') {
      depth += 1;
    }
    else if (char === ']' || char === '}') {
      depth -= 1;
    }
    else if (char === ',' && depth === 0) {
      entries.push(text.slice(start, index));
      start = index + 1;
    }
  }

  return [...entries, text.slice(start)];
};

const rulesTurnedOffBy = (tail: string): string[] => {
  return topLevelEntries(tail.replace(DESCRIPTION, ''))
    .flatMap((entry) => {
      const colon = entry.indexOf(':');

      if (colon === -1 || !OFF_SEVERITY.test(entry.slice(colon + 1))) {
        return [];
      }

      return [entry
        .slice(0, colon)
        .trim()
        .replaceAll(/^["']|["']$/gu, '')];
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
          const config = comment.type === 'Block' ? INLINE_CONFIG.exec(comment.value)?.[1] : undefined;
          const named = tail === undefined ? rulesTurnedOffBy(config ?? '') : rulesNamedBy(tail);

          if (tail === undefined && named.length === 0) {
            continue;
          }

          // A directive naming an allowed rule beside a forbidden one suppresses both.
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
