import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  indentReader,
  lineTerminatorOf,
  spliceOntoNewline,
} from '../../utils/layoutUtils.ts';
import {
  type Fixer,
  optionsOf,
  rebuildLosesComments,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import {
  analyzeProperties,
  endTokenOf,
  type PatternAnalysis,
  type PropertyNode,
  startTokenOf,
} from './boundaryUtils.ts';

import type { Rule } from 'eslint';

// `typeAnnotation` is TypeScript-only, so it is optional here rather than asserted, letting the visitor skip a cast.
type ObjectPatternNode = Extract<RuleNode, { type: 'ObjectPattern' }> & {
  optional?: boolean;
  typeAnnotation?: RuleNode;
};

// Same as `ObjectPatternNode`: ESLint 10 checks a selector's handler against `Rule.Node`, which carries neither list.
type InterfaceBodyNode = RuleNode & {
  body?: PropertyNode[];
};

type TypeLiteralNode = RuleNode & {
  members?: PropertyNode[];
};

// What `context.report` accepts; the two builders answer different shapes, so one ladder serves both without a cast.
type ReportFix = (fixer: Fixer) => IterableIterator<Rule.Fix> | Rule.Fix | null;

interface NewlineDestructuringOptions {
  maxProperties: number;
  maxPropertiesWithRest: number;
}

const isRestElement = (property: { type: string }): boolean => {
  return property.type === 'RestElement';
};

const DEFAULT_MAX_PROPERTIES = 2;
const DEFAULT_MAX_PROPERTIES_WITH_REST = 1;

export const newlineDestructuring = createRule('newline-destructuring', {
  meta: {
    type: 'layout',
    docs: {
      category: 'layout',
      language: 'universal',
      recommended: true,
      description: 'Keep crowded destructuring patterns, interfaces, and type literals on separate lines.',
    },
    // `code`, not `whitespace`: the `ObjectPattern` branch rebuilds the pattern and drops a
    // trailing comma, a token edit that `--fix-type whitespace` would skip.
    fixable: 'code',
    messages: {
      mustSplit:
        'Properties must be broken into multiple lines if there are more than {{maxProperties}}.',
      noBlankBetween: 'Properties cannot have blank lines between them.',
      consistNewline: 'Properties must be put on newlines.',
      multilineProperty: 'Multiline property must be put on newlines.',
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
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const options = optionsOf<NewlineDestructuringOptions>(context);
    const maxCount = options.maxProperties ?? DEFAULT_MAX_PROPERTIES;
    const maxRestCount = options.maxPropertiesWithRest ?? DEFAULT_MAX_PROPERTIES_WITH_REST;
    const sourceCode = sourceCodeOf(context);
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);

    const buildFix = (node: ObjectPatternNode, multiLine = true): ((fixer: Fixer) => Rule.Fix | null) => {
      return (fixer) => {
        if (rebuildLosesComments(sourceCode, node)) {
          return null;
        }

        const { outer, inner: indentInner } = indentsAt(node);

        const parts = node.properties.map((prop, index) => {
          const isLast = index === node.properties.length - 1;
          const separator = multiLine ? `,${eol}${indentInner}` : ', ';
          const suffix = isLast ? '' : separator;

          // No special case for `RestElement`: its text already carries the dots, and rebuilding
          // it as `...` plus `argument.name` breaks on a member-expression rest target.
          return `${sourceCode.getText(prop)}${suffix}`;
        });

        const inner = parts.join('');
        // Collapsed form keeps the inner spaces, matching both the split form's style and what `import-newlines` emits.
        const body = multiLine ? `{${eol}${indentInner}${inner}${eol}${outer}}` : `{ ${inner} }`;
        const annotation = node.typeAnnotation ? sourceCode.getText(node.typeAnnotation) : '';
        // The optional `?` sits between the closing brace and the annotation; dropping it makes the parameter required.
        const optional = node.optional ? '?' : '';

        return fixer.replaceText(node, `${body}${optional}${annotation}`);
      };
    };

    const splitMembers = function* (
      fixer: Fixer,
      members: RuleNode[],
      indentInner: string,
    ): IterableIterator<Rule.Fix> {
      // A `TSPropertySignature` node covers its own trailing `;` or `,`, so the last token is already the separator.
      for (const [previous, member] of adjacentPairs(members)) {
        const endToken = endTokenOf(sourceCode, previous);
        const targetToken = startTokenOf(sourceCode, member);

        /* v8 ignore next 3 -- members are parsed nodes, so their tokens carry ranges and locations */
        if (!endToken?.range || !targetToken?.range || !endToken.loc || !targetToken.loc) {
          continue;
        }

        const needsNewline = endToken.loc.end.line === targetToken.loc.start.line;
        const hasBlankLines = targetToken.loc.start.line > endToken.loc.end.line + 1;

        if (needsNewline || hasBlankLines) {
          yield fixer.replaceTextRange([endToken.range[1], targetToken.range[0]], `${eol}${indentInner}`);
        }
      }
    };

    const buildMemberFix = (
      node: RuleNode,
      members: RuleNode[],
    ): ((fixer: Fixer) => IterableIterator<Rule.Fix>) => {
      return function* (fixer) {
        const [firstMember] = members;
        const lastMember = members[members.length - 1];

        /* v8 ignore next 3 -- checkMembers only calls this with two or more members */
        if (!firstMember || !lastMember) {
          return;
        }

        const closeBrace = sourceCode.getLastToken(node);

        // `getLastToken` skips comments, so a note in the splice gap would be lost; decline the fix, like the rebuild.
        if (closeBrace && sourceCode.getCommentsBefore(closeBrace).length > 0) {
          return;
        }

        const { outer, inner } = indentsAt(node);
        const openBrace = sourceCode.getFirstToken(node);

        // The first member moves down only if it is sharing the brace's line.
        yield* spliceOntoNewline(fixer, openBrace, startTokenOf(sourceCode, firstMember), inner, eol);

        yield* splitMembers(fixer, members, inner);

        yield* spliceOntoNewline(fixer, sourceCode.getLastToken(lastMember), closeBrace, outer, eol);
      };
    };

    // A member that spans lines drags the whole block open regardless of count; the pattern
    // rebuild cannot express it, so `ObjectPattern` calls this with no fix.
    const reportedMultilineProperty = (
      node: RuleNode,
      analysis: PatternAnalysis,
      fix?: ReportFix,
    ): boolean => {
      if (!analysis.hasMultilineProperty || analysis.isMultiLine) {
        return false;
      }

      context.report({
        node,
        messageId: 'multilineProperty',
        fix,
      });

      return true;
    };

    // The three complaints a block over the threshold can draw; a rebuilt pattern or spliced
    // member list answers all three, so the fix is a parameter.
    const reportOverThreshold = (node: RuleNode, analysis: PatternAnalysis, fix: ReportFix) => {
      if (!analysis.isMultiLine) {
        context.report({
          node,
          messageId: 'mustSplit',
          data: { maxProperties: String(maxCount) },
          fix,
        });

        return;
      }

      if (analysis.hasSameLinePairs) {
        context.report({
          node,
          messageId: 'consistNewline',
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

      if (reportedMultilineProperty(node, analysis, fix)) {
        return;
      }

      if (members.length > maxCount) {
        reportOverThreshold(node, analysis, fix);
      }
    };

    return {
      ObjectPattern: (node: ObjectPatternNode) => {
        const properties = node.properties as PropertyNode[];

        if (properties.length <= 1) {
          return;
        }

        const hasRest = properties.some(isRestElement);
        const threshold = hasRest ? maxRestCount : maxCount;
        const analysis = analyzeProperties(sourceCode, properties);

        if (reportedMultilineProperty(node, analysis)) {
          return;
        }

        if (properties.length > threshold) {
          reportOverThreshold(node, analysis, buildFix(node));
          return;
        }

        if (analysis.isMultiLine && !analysis.hasMultilineProperty) {
          context.report({
            node,
            messageId: 'mustSplit',
            data: { maxProperties: String(maxCount) },
            fix: buildFix(node, false),
          });
        }
      },

      TSInterfaceBody: (node: InterfaceBodyNode) => {
        /* v8 ignore next -- the selector only matches a node that has a body */
        checkMembers(node, node.body ?? []);
      },

      TSTypeLiteral: (node: TypeLiteralNode) => {
        /* v8 ignore next -- the selector only matches a node that has members */
        checkMembers(node, node.members ?? []);
      },
    };
  },
});
