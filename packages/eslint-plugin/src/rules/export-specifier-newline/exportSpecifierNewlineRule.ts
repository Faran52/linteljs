import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  breakGaps,
  gapsToBreak,
  indentReader,
  lineTerminatorOf,
  listGaps,
} from '../../utils/layoutUtils.ts';
import { createRule, mustFind } from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

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

    const visitors: Rule.RuleListener = {
      ExportNamedDeclaration: (node) => {
        const { specifiers } = node;

        if (specifiers.length < 2) {
          return;
        }

        const first = mustFind(specifiers[0]);
        const open = mustFind(sourceCode.getTokenBefore(first));
        const gaps = listGaps(sourceCode, open, specifiers, indentsAt(node), true);
        const toBreak = gapsToBreak(gaps, MAX_INLINE);

        if (toBreak.length === 0) {
          return;
        }

        context.report({
          node,
          messageId: 'specifiersOnNewline',
          fix: breakGaps(toBreak, eol),
        });
      },
    };

    return visitors;
  },
});
