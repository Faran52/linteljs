import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  breakGaps,
  gapsToBreak,
  indentReader,
  isBlank,
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
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import type { AST, Rule } from 'eslint';

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

const spansLines = (located: Member | AST.Token): boolean => {
  const { start, end } = mustFind(located.loc);

  return start.line !== end.line;
};

// A token spanning lines (a template, JSX text, a continued string) holds its lines as its value.
const LINE_BREAKS = new Set(['\n', '\r']);

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

    // Each member one step in, its own inner lines included, so a closer never lands left of its opener.
    const splitSpanning = (gaps: ListGap[], members: Member[], step: string) => {
      const breaks = breakGaps(gaps, eol);

      return function* (fixer: Fixer): IterableIterator<Rule.Fix> {
        yield* breaks(fixer);

        for (const member of members) {
          const { start, end } = mustFind(member.loc);

          for (let line = start.line + 1; line <= end.line; line += 1) {
            const lineStart = sourceCode.getIndexFromLoc({
              line,
              column: 0,
            });
            const firstCharacter = sourceCode.text.charAt(lineStart);

            if (LINE_BREAKS.has(firstCharacter)) {
              continue;
            }

            yield fixer.insertTextBeforeRange([lineStart, lineStart], step);
          }
        }
      };
    };

    // `blanksCount` is off for an object literal, where a blank line groups properties on purpose.
    // `splitsSpanning` splits a one-line pattern that holds a multi-line member.
    const check = (
      node: RuleNode,
      members: Member[],
      commaSeparated: boolean,
      { blanksCount = true, splitsSpanning = false } = {},
    ) => {
      if (members.length < 2) {
        return;
      }

      const open = mustFind(sourceCode.getFirstToken(node));
      const indents = indentsAt(node);
      const gaps = listGaps(sourceCode, open, members, indents, commaSeparated);
      const toBreak = gapsToBreak(gaps, maxCount);
      // With nothing to break, the first gap tells a one-line list from a split one.
      const [beforeFirst, firstToken] = mustFind(gaps[0]);
      const opensInline = sameLine(beforeFirst, firstToken);
      const hasSpanning = members.some(spansLines);
      const spanning = splitsSpanning && toBreak.length === 0 && opensInline && hasSpanning;

      if (spanning) {
        const hasComments = sourceCode.getCommentsInside(node).length > 0;
        const hasVerbatim = sourceCode
          .getTokens(node)
          .some(spansLines);
        const unsafe = hasComments || hasVerbatim;
        const step = indents.inner.slice(indents.outer.length);
        const split = splitSpanning(gaps, members, step);

        // Report only around a comment or a token spanning lines: neither is worth the risk.
        context.report({
          node,
          messageId: 'membersOnNewline',
          fix: unsafe ? null : split,
        });

        return;
      }

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
        check(node, node.properties, true, { blanksCount: false });
      },

      ObjectPattern: (node) => {
        check(node, node.properties, true, { splitsSpanning: true });
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
