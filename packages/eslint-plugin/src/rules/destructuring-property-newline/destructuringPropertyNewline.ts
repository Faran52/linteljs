import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  fixCommaToNewline,
  indentReader,
  sameLine,
} from '../../utils/layoutUtils.ts';
import { mustFind, type RuleNode } from '../../utils/ruleUtils.ts';

// A member of either pattern; the array-pattern side carries holes in `[, , third]` as nulls, hence the null.
type PatternMember
  = Extract<RuleNode, { type: 'ObjectPattern' }>['properties'][number]
    | Extract<RuleNode, { type: 'ArrayPattern' }>['elements'][number];

export const destructuringPropertyNewline = createRule('destructuring-property-newline', {
  meta: {
    type: 'layout',
    docs: {
      category: 'layout',
      language: 'universal',
      recommended: true,
      description: 'Keep destructuring patterns either compact or fully expanded, never half-split.',
    },
    fixable: 'whitespace',
    messages: {
      propertiesOnNewline:
        'Destructuring properties must go on a new line if they aren\'t all on the same line.',
    },
    schema: [],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);

    const checkProperties = (node: RuleNode, properties: PatternMember[]) => {
      // A pattern with one member or none yields no pairs below, so the indent read is wasted work.
      if (properties.length <= 1) {
        return;
      }

      const [first] = properties;
      const last = properties[properties.length - 1];

      if (!first || !last) {
        return;
      }

      const firstToken = sourceCode.getFirstToken(first);
      const lastToken = sourceCode.getLastToken(last);

      if (sameLine(firstToken, lastToken)) {
        return;
      }

      // The member moves onto a line of its own, one step in from the line the pattern starts on,
      // not to column 0, which is correct only for a pattern already at the margin.
      const { inner } = indentsAt(node);

      for (const [previous, current] of adjacentPairs(properties)) {
        // An array pattern's holes are nulls (`[, , third]`); a pair with a hole has no token to measure.
        if (!previous || !current) {
          continue;
        }

        const previousToken = mustFind(sourceCode.getLastToken(previous));
        const currentToken = mustFind(sourceCode.getFirstToken(current));

        if (sameLine(previousToken, currentToken)) {
          context.report({
            loc: currentToken.loc,
            messageId: 'propertiesOnNewline',
            node: current,
            fix: (fixer) => {
              return fixCommaToNewline(sourceCode, fixer, currentToken, inner);
            },
          });
        }
      }
    };

    return {
      ObjectPattern: (node) => {
        checkProperties(node, node.properties);
      },
      ArrayPattern: (node) => {
        checkProperties(node, node.elements);
      },
    };
  },
});
