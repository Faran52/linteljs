import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  indentReader,
  lineTerminatorOf,
  type ListGap,
  listGaps,
  sameLine,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  type Fixer,
  mustFind,
  optionsOf,
  rangeOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { Rule, SourceCode } from 'eslint';

type Member = Parameters<SourceCode['getLastToken']>[0];

// ESLint 10 checks a selector's handler against `Rule.Node`, which carries neither list.
interface Bodied {
  body?: Member[];
}

interface Membered {
  members?: Member[];
}

type InterfaceBodyNode = RuleNode & Bodied;

type TypeLiteralNode = RuleNode & Membered;

interface MemberNewlineOptions {
  maxProperties: number;
}

const DEFAULT_MAX_PROPERTIES = 2;

const isBlank = ([before, after]: ListGap): boolean => {
  return mustFind(after.loc).start.line > mustFind(before.loc).end.line + 1;
};

export const memberNewline = createRule('member-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description:
        'Put each member of an object, object pattern, interface, or type literal with three or more on its own line.',
    },
    fixable: 'whitespace',
    messages: {
      mustSplit:
        'Members must be broken into multiple lines if there are more than {{maxProperties}}.',
      noBlankBetween: 'Members cannot have blank lines between them.',
      membersOnNewline: 'Put each member on its own line, with the braces on lines of their own.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxProperties: {
            type: 'integer',
            minimum: 0,
            default: DEFAULT_MAX_PROPERTIES,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const options = optionsOf<MemberNewlineOptions>(context);
    const maxCount = options.maxProperties ?? DEFAULT_MAX_PROPERTIES;
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    // `blanksCount` is off for an object literal, where a blank line groups properties on purpose.
    const check = (node: RuleNode, members: Member[], commaSeparated: boolean, blanksCount = true) => {
      if (members.length < 2) {
        return;
      }

      const gaps = listGaps(sourceCode, node, members, indentsAt(node), commaSeparated);
      const isOver = members.length > maxCount;
      const onOneLine = gaps
        .filter(([before, after]) => {
          return sameLine(before, after);
        });
      const blank = isOver && blanksCount ? gaps.filter(isBlank) : [];

      const fix = (fixer: Fixer): Rule.Fix[] => {
        return [...onOneLine, ...blank]
          .map(([
            before,
            after,
            indent,
          ]) => {
            return fixer.replaceTextRange([rangeOf(before)[1], rangeOf(after)[0]], `${eol}${indent}`);
          });
      };

      // All on one line is fine up to the count; a list broken anywhere is broken everywhere.
      if (onOneLine.length === gaps.length) {
        if (isOver) {
          context.report({
            node,
            messageId: 'mustSplit',
            data: { maxProperties: String(maxCount) },
            fix,
          });
        }
      }
      else if (onOneLine.length > 0) {
        context.report({
          node,
          messageId: 'membersOnNewline',
          fix,
        });
      }

      if (blank.length > 0) {
        context.report({
          node,
          messageId: 'noBlankBetween',
          fix,
        });
      }
    };

    return {
      ObjectExpression: (node) => {
        check(node, node.properties, true, false);
      },

      ObjectPattern: (node) => {
        check(node, node.properties, true);
      },

      TSInterfaceBody: (node: InterfaceBodyNode) => {
        check(node, mustFind(node.body), false);
      },

      TSTypeLiteral: (node: TypeLiteralNode) => {
        check(node, mustFind(node.members), false);
      },
    };
  },
});
