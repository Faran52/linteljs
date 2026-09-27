import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  gapIsBlank,
  indentReader,
  lineTerminatorOf,
  sameLine,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface UnionNewlineOptions {
  maxGenericMembers: number;
}

// `types` is optional: ESLint 10 checks handlers against `Rule.Node`, which lacks it; the selector guarantees it.
interface Composed {
  types?: RuleNode[];
}

type UnionTypeNode = RuleNode & Composed;

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
      language: 'typescript',
      recommended: true,
      fixShape: 'whitespace',
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

    // A union type is never a child of `Program`, so it always has a parent. Widened to `string`, not cast: ESLint
    // types `parent` as ESTree, and comparing that union directly is a TS2367 the runtime does not share.
    const isInsideGenericArg = (node: RuleNode): boolean => {
      const parentType: string = mustFind(node.parent, 'the parent of a union type').type;

      return parentType === 'TSTypeParameterInstantiation';
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
            const pipe = sourceCode
              .getTokenBefore(curr, (token) => {
                return token.value === '|';
              });
            const pipeToken = mustFind(pipe, 'the `|` before a union member');
            const tokenBeforePipe = mustFind(sourceCode.getTokenBefore(pipeToken), "the token before a union's `|`");

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
        const types = mustFind(node.types, 'the members of a union type');
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
