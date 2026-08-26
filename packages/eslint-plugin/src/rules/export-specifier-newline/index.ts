import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  fixCommaToNewline,
  indentReader,
  lineTerminatorOf,
  sameLine,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import { mustFind, rebuildLosesComments } from '../../utils/ruleUtils.ts';

import type { AST } from 'eslint';

// A specifier that starts on the line the one before it ended on, and its first token.
interface SharedLine {
  // Whether it is the last specifier, which is what the closing-brace splice hangs off.
  isLast: boolean;
  token: AST.Token;
}

export const exportSpecifierNewline = createRule('export-specifier-newline', {
  meta: {
    type: 'layout',
    docs: {
      category: 'layout',
      language: 'universal',
      recommended: true,
      description: 'Put each export specifier on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      specifiersOnNewline: 'Export specifiers must go on a new line.',
    },
    schema: [],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    return {
      ExportNamedDeclaration: (node) => {
        const [first] = node.specifiers;
        const last = node.specifiers[node.specifiers.length - 1];

        if (!first || !last) {
          return;
        }

        // Members sit one step in from the statement, braces on their own lines.
        const { outer: indent, inner } = indentsAt(node);
        const openBrace = sourceCode.getTokenBefore(first);
        const closeBrace = sourceCode.getTokenAfter(last);

        // The open-brace splice belongs to the first report, not to specifier index 1.
        const shared: SharedLine[] = [];

        for (const [previous, specifier] of adjacentPairs(node.specifiers)) {
          const currentToken = mustFind(sourceCode.getFirstToken(specifier));

          if (sameLine(sourceCode.getLastToken(previous), currentToken)) {
            shared.push({
              isLast: specifier === last,
              token: currentToken,
            });
          }
        }

        for (const [position, pair] of shared.entries()) {
          context.report({
            loc: pair.token.loc,
            messageId: 'specifiersOnNewline',
            node,
            * fix(fixer) {
              // Brace gaps are spliced wholesale below, so a comment there would be lost.
              if (rebuildLosesComments(sourceCode, node)) {
                return;
              }

              // Comments are already ruled out above, so the gap is blank.
              const split = fixCommaToNewline(sourceCode, fixer, pair.token, inner);

              /* v8 ignore next 3 -- the comment check above guarantees a blank gap */
              if (!split) {
                return;
              }

              // Brace gaps belong to the statement, not to this pair, so each is emitted once.
              if (position === 0) {
                yield* spliceOntoNewline(fixer, openBrace, first, inner, eol);
              }

              yield split;

              if (pair.isLast) {
                yield* spliceOntoNewline(fixer, sourceCode.getLastToken(last), closeBrace, indent, eol);
              }
            },
          });
        }
      },
    };
  },
});
