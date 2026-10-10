import {
  breakGaps,
  gapsToBreak,
  indentReader,
  isBlank,
  lineTerminatorOf,
  listGaps,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface SpecifierNewlineOptions {
  maxItems: number;
}

const DEFAULT_MAX_ITEMS = 2;

export const specifierNewline = createRule('specifier-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each specifier of an import or export list with three or more on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      mustSplitMany: 'Put each specifier on its own line when there are more than {{maxItems}}.',
      limitLineCount: 'Put each specifier on its own line.',
      noBlankBetween: 'Remove the blank lines between specifiers.',
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
    const { sourceCode } = context;
    const options = optionsOf<SpecifierNewlineOptions>(context);
    const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    const check = (node: RuleNode, specifiers: Parameters<typeof listGaps>[2]): void => {
      if (specifiers.length < 2) {
        return;
      }

      const first = mustFind(specifiers[0]);
      const open = mustFind(sourceCode.getTokenBefore(first));
      const gaps = listGaps(sourceCode, open, specifiers, indentsAt(node), true);
      const toBreak = gapsToBreak(gaps, maxItems);
      const blank = gaps.filter(isBlank);
      // Both reports carry every break, since two fixes in one statement overlap and the second waits a pass.
      const fix = breakGaps([...toBreak, ...blank], eol);

      if (blank.length > 0) {
        context.report({
          node,
          messageId: 'noBlankBetween',
          fix,
        });
      }

      if (toBreak.length === 0) {
        return;
      }

      context.report({
        node,
        messageId: toBreak.length === gaps.length ? 'mustSplitMany' : 'limitLineCount',
        data: { maxItems: String(maxItems) },
        fix,
      });
    };

    const visitors: Rule.RuleListener = {
      ImportDeclaration: (node) => {
        // Only the braced list is laid out: a default or namespace import sits outside it and is never moved.
        const named = node.specifiers
          .filter((specifier) => {
            return specifier.type === 'ImportSpecifier';
          });

        check(node, named);
      },
      ExportNamedDeclaration: (node) => {
        check(node, node.specifiers);
      },
    };

    return visitors;
  },
});
