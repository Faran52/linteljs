import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  indentReader,
  lineTerminatorOf,
  sameLine,
  type SpliceAnchor,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import {
  type ArrayPatternNode,
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { AST } from 'eslint';

interface ArrayExpressionMatch {
  type: 'ArrayExpression';
}

// Holes in `[, , third]` are nulls.
type Slot
  = Extract<RuleNode, ArrayExpressionMatch>['elements'][number]
    | ArrayPatternNode['elements'][number];

type Gap = [SpliceAnchor, SpliceAnchor, string];

const COMMENTS = { includeComments: true };

// A parenthesised element ends before its `)`.
const PAST_PARENS = {
  filter: (token: AST.Token) => {
    return token.value !== ')';
  },
};

export const arrayNewline = createRule('array-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each element of an array or array pattern with two or more on its own line.',
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

    // A same-line comment after a comma trails the element before it, so the break goes after the comment.
    const trailingEnd = (comma: AST.Token) => {
      let trailing;

      for (const comment of sourceCode.getCommentsAfter(comma)) {
        if (!sameLine(comma, comment)) {
          break;
        }

        trailing = comment;
      }

      return trailing ?? comma;
    };

    const check = (node: RuleNode, elements: Slot[]) => {
      if (elements.length < 2) {
        return;
      }

      const { outer, inner } = indentsAt(node);
      const open = mustFind(sourceCode.getFirstToken(node));
      // The token after each element: a comma, or the closing bracket after the last.
      const ends: AST.Token[] = [];
      let cursor = open;

      // A hole has no token, so its comma is the one after the previous end.
      for (const element of elements) {
        const last = element ? mustFind(sourceCode.getLastToken(element)) : cursor;

        cursor = mustFind(sourceCode.getTokenAfter(last, PAST_PARENS));
        ends.push(cursor);
      }

      // `cursor` is the closing bracket, or a trailing comma which stays on the last element's line.
      const close = cursor.value === ']' ? cursor : mustFind(sourceCode.getTokenAfter(cursor));

      const gaps: Gap[] = [
        [open, mustFind(sourceCode.getTokenAfter(open, COMMENTS)), inner],
        ...ends
          .slice(0, -1)
          .map((comma): Gap => {
            const end = trailingEnd(comma);

            return [end, mustFind(sourceCode.getTokenAfter(end, COMMENTS)), inner];
          }),
        [mustFind(sourceCode.getTokenBefore(close, COMMENTS)), close, outer],
      ];

      const crowded = gaps
        .some(([before, after]) => {
          return sameLine(before, after);
        });

      if (!crowded) {
        return;
      }

      context.report({
        node,
        messageId: 'elementsOnNewline',
        * fix(fixer) {
          for (const [before, after, indent] of gaps) {
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
