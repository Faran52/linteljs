import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  breakGaps,
  gapsToBreak,
  indentReader,
  lineTerminatorOf,
  listGaps,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { Rule, SourceCode } from 'eslint';

type Slot = Parameters<SourceCode['getLastToken']>[0] | null;

// Two or fewer stay as written, unless half-split.
const MAX_INLINE = 2;

export const arrayNewline = createRule('array-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each element of an array or array pattern with three or more on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      elementsOnNewline: 'Put each array element on its own line, with the brackets on their own lines.',
    },
    schema: [],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    const check = (node: RuleNode, elements: Slot[]) => {
      if (elements.length < 2) {
        return;
      }

      const open = mustFind(sourceCode.getFirstToken(node));
      const gaps = listGaps(sourceCode, open, elements, indentsAt(node), true);
      const toBreak = gapsToBreak(gaps, MAX_INLINE);

      if (toBreak.length === 0) {
        return;
      }

      context.report({
        node,
        messageId: 'elementsOnNewline',
        fix: breakGaps(toBreak, eol),
      });
    };

    const visitors: Rule.RuleListener = {
      ArrayExpression: (node) => {
        check(node, node.elements);
      },
      ArrayPattern: (node) => {
        check(node, node.elements);
      },
    };

    return visitors;
  },
});
