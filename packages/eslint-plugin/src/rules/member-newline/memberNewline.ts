import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  breakGaps,
  gapsToBreak,
  indentReader,
  isBlank,
  lineTerminatorOf,
  listGaps,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { SourceCode } from 'eslint';

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

      const open = mustFind(sourceCode.getFirstToken(node));
      const gaps = listGaps(sourceCode, open, members, indentsAt(node), commaSeparated);
      const toBreak = gapsToBreak(gaps, maxCount);
      const blank = members.length > maxCount && blanksCount ? gaps.filter(isBlank) : [];
      const fix = breakGaps([...toBreak, ...blank], eol);

      if (toBreak.length > 0) {
        context.report({
          node,
          messageId: toBreak.length === gaps.length ? 'mustSplit' : 'membersOnNewline',
          data: { maxProperties: String(maxCount) },
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
