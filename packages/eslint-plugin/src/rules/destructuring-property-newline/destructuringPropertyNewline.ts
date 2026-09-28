import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  indentReader,
  sameLine,
} from '../../utils/layoutUtils.ts';
import {
  type ArrayPatternNode,
  createRule,
  mustFind,
  type ObjectPatternNode,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import { fixCommaToNewline } from './utils/commaUtils.ts';

// The array-pattern side carries holes in `[, , third]` as nulls.
type PatternMember
  = ObjectPatternNode['properties'][number]
    | ArrayPatternNode['elements'][number];

export const destructuringPropertyNewline = createRule('destructuring-property-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
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

      // One step in from the pattern's line, not column 0.
      const { inner } = indentsAt(node);

      for (const [previous, current] of adjacentPairs(properties)) {
        // A pair with a hole has no token to measure.
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
