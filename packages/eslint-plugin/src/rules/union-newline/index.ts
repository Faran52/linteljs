import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  gapIsBlank,
  indentReader,
  lineTerminatorOf,
  sameLine,
} from '../../utils/layoutUtils.ts';
import {
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface UnionNewlineOptions {
  maxGenericMembers: number;
}

// `types` is optional: ESLint 10 checks handlers against `Rule.Node`, which lacks it; the selector guarantees it.
type UnionTypeNode = RuleNode & {
  types?: RuleNode[];
};

const COMPLEX_UNION_MEMBER_TYPES = new Set([
  'TSTypeLiteral',
  'TSFunctionType',
  'TSConstructorType',
  'TSMappedType',
]);

const DEFAULT_MAX_GENERIC_MEMBERS = 3;

export const unionNewline = createRule('union-newline', {
  meta: {
    type: 'layout',
    docs: {
      category: 'layout',
      language: 'typescript',
      recommended: true,
      description: 'Split union types when object or function members make them hard to read.',
    },
    fixable: 'whitespace',
    messages: {
      complexUnionNewline:
        'Union containing object or function types must have each member on a new line.',
      genericUnionNewline:
        'Union in generic type argument must split when more than {{maxGenericMembers}} members.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxGenericMembers: {
            type: 'integer',
            minimum: 1,
            default: DEFAULT_MAX_GENERIC_MEMBERS,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const options = optionsOf<UnionNewlineOptions>(context);
    const maxGenericMembers = options.maxGenericMembers ?? DEFAULT_MAX_GENERIC_MEMBERS;
    const indentsAt = indentReader(sourceCode);

    const eol = lineTerminatorOf(sourceCode);

    const isComplexMember = (member: RuleNode): boolean => {
      return COMPLEX_UNION_MEMBER_TYPES.has(member.type);
    };

    // `String()` rather than a cast: ESLint types `parent` as ESTree, so a direct comparison is TS2367.
    const isInsideGenericArg = (node: RuleNode): boolean => {
      return String(node.parent?.type) === 'TSTypeParameterInstantiation';
    };

    // An object or function member always splits; length only decides inside a generic argument.
    const messageIdFor = (node: UnionTypeNode, members: RuleNode[]): string | null => {
      if (members.some(isComplexMember)) {
        return 'complexUnionNewline';
      }

      if (isInsideGenericArg(node) && members.length > maxGenericMembers) {
        return 'genericUnionNewline';
      }

      return null;
    };

    const isAlreadySplit = (types: RuleNode[]): boolean => {
      for (const [previous, member] of adjacentPairs(types)) {
        if (sameLine(previous, member)) {
          return false;
        }
      }

      return true;
    };

    const buildUnionFix = (
      node: RuleNode,
      types: RuleNode[],
    ): ((fixer: Rule.RuleFixer) => IterableIterator<Rule.Fix>) => {
      // Emitting continuation lines at column 0 puts `| string` against the margin, wrong inside an interface body.
      const { inner } = indentsAt(node);

      return function* (fixer) {
        for (const [previous, curr] of adjacentPairs(types)) {
          if (sameLine(previous, curr)) {
            // A pipe separating two members sharing a line is always preceded by the member before it.
            const pipeToken = mustFind(sourceCode.getTokenBefore(curr, (token) => {
              return token.value === '|';
            }));
            const tokenBeforePipe = mustFind(sourceCode.getTokenBefore(pipeToken));

            // The pipe lookup skips comments, so a note written before it goes with the splice below.
            if (!gapIsBlank(sourceCode, tokenBeforePipe.range[1], pipeToken.range[0])) {
              return;
            }

            yield fixer.replaceTextRange(
              [tokenBeforePipe.range[1], pipeToken.range[0]],
              `${eol}${inner}`,
            );
          }
        }
      };
    };

    return {
      TSUnionType: (node: UnionTypeNode) => {
        /* v8 ignore next -- the selector only matches a node that has members */
        const types = node.types ?? [];
        const messageId = messageIdFor(node, types);

        if (!messageId) {
          return;
        }

        if (isAlreadySplit(types)) {
          return;
        }

        context.report({
          node,
          messageId,
          data: { maxGenericMembers: String(maxGenericMembers) },
          fix: buildUnionFix(node, types),
        });
      },
    };
  },
});
