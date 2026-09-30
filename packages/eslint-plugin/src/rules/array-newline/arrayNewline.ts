import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  indentReader,
  lineTerminatorOf,
  listGaps,
  sameLine,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { SourceCode } from 'eslint';

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
      const onOneLine = gaps
        .filter(([before, after]) => {
          return sameLine(before, after);
        });

      // Crowded: over the count on a shared line. Half-split: some breaks made and some not.
      if (onOneLine.length === 0 || (elements.length <= MAX_INLINE && onOneLine.length === gaps.length)) {
        return;
      }

      context.report({
        node,
        messageId: 'elementsOnNewline',
        * fix(fixer) {
          for (const [
            before,
            after,
            indent,
          ] of onOneLine) {
            yield* spliceOntoNewline(fixer, before, after, indent, eol);
          }
        },
      });
    };

    return {
      ArrayExpression: (node) => {
        check(node, node.elements);
      },
      ArrayPattern: (node) => {
        check(node, node.elements);
      },
    };
  },
});
