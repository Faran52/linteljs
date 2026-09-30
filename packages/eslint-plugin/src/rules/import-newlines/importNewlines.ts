import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  breakGaps,
  gapsToBreak,
  indentReader,
  lineTerminatorOf,
  type ListGap,
  listGaps,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  optionsOf,
  rangeOf,
} from '../../utils/ruleUtils.ts';

interface ImportNewlinesOptions {
  maxItems: number;
}

const DEFAULT_MAX_ITEMS = 2;

const isBlank = ([before, after]: ListGap): boolean => {
  return mustFind(after.loc).start.line > mustFind(before.loc).end.line + 1;
};

export const importNewlines = createRule('import-newlines', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each named import of an import with three or more on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      mustSplitMany:
        'Imports must be broken into multiple lines if there are more than {{maxItems}} elements.',
      limitLineCount:
        'Import lines must have one element per line.',
      noBlankBetween: 'Import lines cannot have blank lines between them.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxItems: {
            type: 'integer',
            minimum: 0,
            default: DEFAULT_MAX_ITEMS,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const options = optionsOf<ImportNewlinesOptions>(context);
    const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    return {
      ImportDeclaration: (node) => {
        // Only the braced list is laid out: a default or namespace import sits outside it and is never moved.
        const named = node.specifiers
          .filter((specifier) => {
            return specifier.type === 'ImportSpecifier';
          });

        if (named.length < 2) {
          return;
        }

        const open = mustFind(sourceCode.getTokenBefore(mustFind(named[0])));
        const gaps = listGaps(sourceCode, open, named, indentsAt(node), true);
        const toBreak = gapsToBreak(gaps, maxItems);
        const blank = gaps.filter(isBlank);

        if (blank.length > 0) {
          context.report({
            node,
            messageId: 'noBlankBetween',
            fix: (fixer) => {
              return blank
                .map(([
                  before,
                  after,
                  indent,
                ]) => {
                  return fixer.replaceTextRange([rangeOf(before)[1], rangeOf(after)[0]], `${eol}${indent}`);
                });
            },
          });
        }

        if (toBreak.length === 0) {
          return;
        }

        context.report({
          node,
          messageId: toBreak.length === gaps.length ? 'mustSplitMany' : 'limitLineCount',
          data: { maxItems: String(maxItems) },
          fix: breakGaps(toBreak, eol),
        });
      },
    };
  },
});
