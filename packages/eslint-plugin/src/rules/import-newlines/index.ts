import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  indentReader,
  lineTerminatorOf,
} from '../../utils/layoutUtils.ts';
import { type Fixer, optionsOf } from '../../utils/ruleUtils.ts';

import { type ImportNode, writeImport } from './writeUtils.ts';

import type { Rule } from 'eslint';

interface ImportNewlinesOptions {
  maxItems: number;
  maxLineLength: number;
}

const isNamedSpecifier = (specifier: { type: string }): boolean => {
  return specifier.type === 'ImportSpecifier';
};

const DEFAULT_MAX_ITEMS = 2;
const DEFAULT_MAX_LINE_LENGTH = 120;

export const importNewlines = createRule('import-newlines', {
  meta: {
    type: 'layout',
    docs: {
      category: 'layout',
      language: 'universal',
      recommended: true,
      description: 'Split import lists when they get crowded or too long.',
    },
    // `code`, not `whitespace`: rebuilding the clause can drop a redundant `as alpha` or a trailing comma.
    fixable: 'code',
    messages: {
      mustSplitMany:
        'Imports must be broken into multiple lines if there are more than {{maxItems}} elements.',
      mustSplitLong:
        'Imports must be broken into multiple lines if the line length exceeds {{maxLineLength}} characters.',
      mustNotSplit:
        'Imports must not be broken into multiple lines if there are {{maxItems}} or less elements.',
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
          maxLineLength: {
            type: 'integer',
            minimum: 1,
            default: DEFAULT_MAX_LINE_LENGTH,
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
    const maxLineLength = options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
    const messageData = {
      maxItems: String(maxItems),
      maxLineLength: String(maxLineLength),
    };

    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    const fixTo = (node: ImportNode, text: string | null): ((fixer: Fixer) => Rule.Fix)
      | null => {
      if (text === null) {
        return null;
      }

      return (fixer) => {
        return fixer.replaceText(node, text);
      };
    };

    // Null from the emitter means a comment the rebuild cannot carry, so the report goes out without a fix.
    const splitFix = (node: ImportNode): ((fixer: Fixer) => Rule.Fix)
      | null => {
      return fixTo(node, writeImport(sourceCode, node, indentsAt(node), eol));
    };

    // Measured from tokens, not node locations: a token's `loc` is always present, a node's is optional in the type.
    const hasBlankLines = (specifiers: ImportNode['specifiers']): boolean => {
      for (const [previous, specifier] of adjacentPairs(specifiers)) {
        const before = sourceCode.getLastToken(previous);
        const current = sourceCode.getFirstToken(specifier);

        // Both always exist for a parsed specifier: a type requirement, not a real branch.
        if (before && current && current.loc.start.line - before.loc.end.line > 1) {
          return true;
        }
      }

      return false;
    };

    const checkSingleLineImport = (node: ImportNode, namedCount: number) => {
      if (sourceCode.getText(node).length + node.loc.start.column > maxLineLength) {
        // Only a named specifier can be broken onto its own line; a default or namespace import has nothing to split.
        if (namedCount > 0) {
          context.report({
            node,
            messageId: 'mustSplitLong',
            data: messageData,
            fix: splitFix(node),
          });
        }

        return;
      }

      if (namedCount > maxItems) {
        context.report({
          node,
          messageId: 'mustSplitMany',
          data: messageData,
          fix: splitFix(node),
        });
      }
    };

    const checkMultiLineImport = (node: ImportNode, namedCount: number, importLineCount: number) => {
      if (importLineCount !== namedCount + 2) {
        context.report({
          node,
          messageId: 'limitLineCount',
          fix: splitFix(node),
        });

        return;
      }

      if (namedCount > maxItems) {
        return;
      }

      const collapsed = writeImport(sourceCode, node, null, eol);

      // No collapsed form means the statement cannot be rewritten, so reporting it would leave an unfixable error.
      if (collapsed === null || collapsed.length + node.loc.start.column > maxLineLength) {
        return;
      }

      context.report({
        node,
        messageId: 'mustNotSplit',
        data: messageData,
        fix: fixTo(node, collapsed),
      });
    };

    return {
      ImportDeclaration: (node) => {
        const importNode = node as ImportNode;
        const { specifiers } = importNode;

        // `import 'x'` and `import {} from 'x'` have no clause; rebuilding yields `import  from 'x'`, unparseable.
        if (specifiers.length === 0) {
          return;
        }

        if (hasBlankLines(specifiers)) {
          context.report({
            node,
            messageId: 'noBlankBetween',
            fix: splitFix(importNode),
          });

          return;
        }

        const namedCount = specifiers.filter(isNamedSpecifier).length;
        const importLineCount = importNode.source.loc.end.line - importNode.loc.start.line + 1;

        if (importLineCount === 1) {
          checkSingleLineImport(importNode, namedCount);
        }
        else {
          checkMultiLineImport(importNode, namedCount, importLineCount);
        }
      },
    };
  },
});
