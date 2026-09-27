import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  commaToNewline,
  indentReader,
  lineTerminatorOf,
  sameLine,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  rebuildLosesComments,
} from '../../utils/ruleUtils.ts';

import type { AST } from 'eslint';

interface SharedLine {
  isLast: boolean;
  token: AST.Token;
}

export const exportSpecifierNewline = createRule('export-specifier-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
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
        if (node.specifiers.length === 0) {
          return;
        }

        const first = mustFind(node.specifiers[0], 'the first specifier of an export');
        const last = mustFind(node.specifiers[node.specifiers.length - 1], 'the last specifier of an export');

        const { outer: indent, inner } = indentsAt(node);
        const openBrace = sourceCode.getTokenBefore(first);
        // Past a trailing comma, which stays on the last specifier's line.
        const closeBrace = mustFind(sourceCode.getTokenAfter(last, {
          filter: (token) => {
            return token.value !== ',';
          },
        }), 'the brace closing an export');
        const beforeCloseBrace = sourceCode.getTokenBefore(closeBrace);

        const shared: SharedLine[] = [];

        for (const [previous, specifier] of adjacentPairs(node.specifiers)) {
          const currentToken = mustFind(sourceCode.getFirstToken(specifier), 'the first token of an export specifier');

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
              // Brace gaps are spliced wholesale, so a comment there would be lost.
              if (rebuildLosesComments(sourceCode, node)) {
                return;
              }

              const split = commaToNewline(sourceCode, fixer, pair.token, inner);

              // Brace gaps belong to the statement, so each is emitted once.
              if (position === 0) {
                yield* spliceOntoNewline(fixer, openBrace, first, inner, eol);
              }

              yield split;

              if (pair.isLast) {
                yield* spliceOntoNewline(fixer, beforeCloseBrace, closeBrace, indent, eol);
              }
            },
          });
        }
      },
    };
  },
});
