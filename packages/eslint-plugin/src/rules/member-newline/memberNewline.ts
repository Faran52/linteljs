import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  fitsOnLine,
  indentReader,
  lineTerminatorOf,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  type Fixer,
  mustFind,
  type ObjectPatternNode,
  optionsOf,
  rangeOf,
  rebuildLosesComments,
  type RuleNode,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import {
  analyzeProperties,
  endTokenOf,
  type PatternAnalysis,
  type PropertyNode,
  startTokenOf,
} from './utils/boundaryUtils.ts';

import type { Rule } from 'eslint';

interface PatternExtras {
  optional?: boolean;
  typeAnnotation?: RuleNode;
}

type DestructuredPattern = ObjectPatternNode & PatternExtras;

// ESLint 10 checks a selector's handler against `Rule.Node`, which carries neither list.
interface Bodied {
  body?: PropertyNode[];
}

type InterfaceBodyNode = RuleNode & Bodied;

interface Membered {
  members?: PropertyNode[];
}

type TypeLiteralNode = RuleNode & Membered;

type ReportFix = (fixer: Fixer) => IterableIterator<Rule.Fix> | Rule.Fix | null;

interface MemberNewlineOptions {
  maxProperties: number;
  maxPropertiesWithRest: number;
  maxLineLength: number;
}

const isRestElement = (property: TypedNode): boolean => {
  return property.type === 'RestElement';
};

const DEFAULT_MAX_PROPERTIES = 2;
const DEFAULT_MAX_PROPERTIES_WITH_REST = 1;
// The same figure `import-newlines` defaults to, since both answer the same question about the same line.
const DEFAULT_MAX_LINE_LENGTH = 120;

export const memberNewline = createRule('member-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Keep crowded destructuring patterns, interfaces, and type literals on separate lines.',
    },
    // `code`: the `ObjectPattern` branch drops a trailing comma, which `--fix-type whitespace` would skip.
    fixable: 'code',
    messages: {
      mustSplit:
        'Members must be broken into multiple lines if there are more than {{maxProperties}}.',
      noBlankBetween: 'Members cannot have blank lines between them.',
      membersOnNewline: 'Members must be put on newlines.',
      multilineMember: 'Multiline member must be put on newlines.',
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
          maxPropertiesWithRest: {
            type: 'integer',
            minimum: 0,
            default: DEFAULT_MAX_PROPERTIES_WITH_REST,
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
    const options = optionsOf<MemberNewlineOptions>(context);
    const maxCount = options.maxProperties ?? DEFAULT_MAX_PROPERTIES;
    const maxRestCount = options.maxPropertiesWithRest ?? DEFAULT_MAX_PROPERTIES_WITH_REST;
    const maxLineLength = options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    // A string rather than a fix, so the collapsed form is measured against the line limit first.
    const writePattern = (node: DestructuredPattern, multiLine: boolean): string | null => {
      if (rebuildLosesComments(sourceCode, node)) {
        return null;
      }

      const { outer, inner: indentInner } = indentsAt(node);

      const parts = node.properties
        .map((prop, index) => {
          const isLast = index === node.properties.length - 1;
          const separator = multiLine ? `,${eol}${indentInner}` : ', ';
          const suffix = isLast ? '' : separator;

          // Not `...` plus `argument.name`, which breaks on a member-expression rest target.
          return `${sourceCode.getText(prop)}${suffix}`;
        });

      const inner = parts.join('');
      const body = multiLine ? `{${eol}${indentInner}${inner}${eol}${outer}}` : `{ ${inner} }`;
      const annotation = node.typeAnnotation ? sourceCode.getText(node.typeAnnotation) : '';
      // Dropping the `?` makes the parameter required.
      const optional = node.optional ? '?' : '';

      return `${body}${optional}${annotation}`;
    };

    const buildFix = (node: DestructuredPattern, multiLine = true): ((fixer: Fixer) => Rule.Fix | null) => {
      return (fixer) => {
        const text = writePattern(node, multiLine);

        return text === null ? null : fixer.replaceText(node, text);
      };
    };

    const splitMembers = function* (
      fixer: Fixer,
      members: RuleNode[],
      indentInner: string,
    ): IterableIterator<Rule.Fix> {
      // A `TSPropertySignature` covers its own trailing `;` or `,`.
      for (const [previous, member] of adjacentPairs(members)) {
        const endToken = mustFind(endTokenOf(sourceCode, previous));
        const targetToken = mustFind(startTokenOf(sourceCode, member));
        const endLine = mustFind(endToken.loc).end.line;
        const targetLine = mustFind(targetToken.loc).start.line;

        if (endLine === targetLine || targetLine > endLine + 1) {
          yield fixer.replaceTextRange([rangeOf(endToken)[1], rangeOf(targetToken)[0]], `${eol}${indentInner}`);
        }
      }
    };

    const buildMemberFix = (
      node: RuleNode,
      members: RuleNode[],
    ): ((fixer: Fixer) => IterableIterator<Rule.Fix>) => {
      return function* (fixer) {
        const firstMember = mustFind(members[0]);
        const lastMember = mustFind(members[members.length - 1]);
        const closeBrace = sourceCode.getLastToken(node);

        // `getLastToken` skips comments, so a note in the splice gap would be lost.
        if (closeBrace && sourceCode.getCommentsBefore(closeBrace).length > 0) {
          return;
        }

        const { outer, inner } = indentsAt(node);
        const openBrace = sourceCode.getFirstToken(node);

        yield* spliceOntoNewline(fixer, openBrace, startTokenOf(sourceCode, firstMember), inner, eol);

        yield* splitMembers(fixer, members, inner);

        yield* spliceOntoNewline(fixer, sourceCode.getLastToken(lastMember), closeBrace, outer, eol);
      };
    };

    // The pattern rebuild cannot express a multiline member, so `ObjectPattern` calls this with no fix.
    const reportedMultilineMember = (
      node: RuleNode,
      analysis: PatternAnalysis,
      fix?: ReportFix,
    ): boolean => {
      if (!analysis.hasMultilineProperty || analysis.isMultiLine) {
        return false;
      }

      context.report({
        node,
        messageId: 'multilineMember',
        fix,
      });

      return true;
    };

    // `threshold` is passed: a pattern with a rest is judged against `maxPropertiesWithRest`.
    const reportOverThreshold = (
      node: RuleNode,
      analysis: PatternAnalysis,
      threshold: number,
      fix: ReportFix,
      // Off for a pattern: `destructuring-property-newline` reports that shape, and one shape is worth one message.
      reportsSameLinePairs = true,
    ) => {
      if (!analysis.isMultiLine) {
        context.report({
          node,
          messageId: 'mustSplit',
          data: { maxProperties: String(threshold) },
          fix,
        });

        return;
      }

      if (analysis.hasSameLinePairs && reportsSameLinePairs) {
        context.report({
          node,
          messageId: 'membersOnNewline',
          fix,
        });
      }

      if (analysis.hasBlankBetween) {
        context.report({
          node,
          messageId: 'noBlankBetween',
          fix,
        });
      }
    };

    const checkMembers = (node: RuleNode, members: PropertyNode[]) => {
      if (members.length <= 1) {
        return;
      }

      const analysis = analyzeProperties(sourceCode, members);
      const fix = buildMemberFix(node, members);

      if (reportedMultilineMember(node, analysis, fix)) {
        return;
      }

      if (members.length > maxCount) {
        reportOverThreshold(node, analysis, maxCount, fix);
      }
    };

    return {
      ObjectPattern: (node: DestructuredPattern) => {
        const properties = node.properties as PropertyNode[];

        if (properties.length <= 1) {
          return;
        }

        const hasRest = properties.some(isRestElement);
        const threshold = hasRest ? maxRestCount : maxCount;
        const analysis = analyzeProperties(sourceCode, properties);

        if (reportedMultilineMember(node, analysis)) {
          return;
        }

        if (properties.length > threshold) {
          reportOverThreshold(node, analysis, threshold, buildFix(node), false);
          return;
        }

        if (analysis.isMultiLine && !analysis.hasMultilineProperty) {
          const collapsed = writePattern(node, false);

          // A collapse the line cannot hold trades this report for a `max-len` finding no fixer can answer.
          if (collapsed !== null && !fitsOnLine(sourceCode, node, collapsed, maxLineLength)) {
            return;
          }

          context.report({
            node,
            messageId: 'mustSplit',
            data: { maxProperties: String(threshold) },
            fix: buildFix(node, false),
          });
        }
      },

      TSInterfaceBody: (node: InterfaceBodyNode) => {
        checkMembers(node, mustFind(node.body));
      },

      TSTypeLiteral: (node: TypeLiteralNode) => {
        checkMembers(node, mustFind(node.members));
      },
    };
  },
});
