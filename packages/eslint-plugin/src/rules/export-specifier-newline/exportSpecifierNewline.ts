import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  indentReader,
  lineTerminatorOf,
  listGaps,
  sameLine,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import { createRule, mustFind } from '../../utils/ruleUtils.ts';

// Two or fewer stay as written, unless half-split.
const MAX_INLINE = 2;

export const exportSpecifierNewline = createRule('export-specifier-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each specifier of an export list with three or more on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      specifiersOnNewline: 'Put each export specifier on its own line, with the braces on their own lines.',
    },
    schema: [],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    return {
      ExportNamedDeclaration: (node) => {
        const { specifiers } = node;

        if (specifiers.length < 2) {
          return;
        }

        const open = mustFind(sourceCode.getTokenBefore(mustFind(specifiers[0])));
        const gaps = listGaps(sourceCode, open, specifiers, indentsAt(node), true);
        const onOneLine = gaps
          .filter(([before, after]) => {
            return sameLine(before, after);
          });

        // Crowded: over the count on a shared line. Half-split: some breaks made and some not.
        if (onOneLine.length === 0 || (specifiers.length <= MAX_INLINE && onOneLine.length === gaps.length)) {
          return;
        }

        context.report({
          node,
          messageId: 'specifiersOnNewline',
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
      },
    };
  },
});
