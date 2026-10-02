import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  gapIsBlank,
  getIndent,
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

import type { AST, Rule } from 'eslint';

interface UnionNewlineOptions {
  maxGenericMembers: number;
}

// `types` is optional: ESLint 10 checks handlers against `Rule.Node`, which lacks it.
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

    // Widened to `string`, not cast: comparing ESLint's ESTree `parent` union directly is a TS2367.
    const isInsideGenericArg = (node: RuleNode): boolean => {
      const parentType: string = mustFind(node.parent).type;

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

    // A leading `|` that opens its line sets the column the other pipes line up under.
    const continuationIndent = (node: RuleNode, first: RuleNode): string => {
      const leading = mustFind(sourceCode.getTokenBefore(first));
      const lineIndent = getIndent(sourceCode, leading);

      if (leading.value === '|' && leading.loc.start.column === lineIndent.length) {
        return lineIndent;
      }

      return indentsAt(node).inner;
    };

    const buildUnionFix = (node: RuleNode, types: RuleNode[]): Rule.ReportFixer | null => {
      const gaps: AST.Range[] = [];

      for (const [previous, curr] of adjacentPairs(types)) {
        if (sameLine(previous, curr)) {
          const pipeLookup = sourceCode
            .getTokenBefore(curr, (token) => {
              return token.value === '|';
            });
          const pipe = mustFind(pipeLookup);
          const tokenBeforePipe = mustFind(sourceCode.getTokenBefore(pipe));

          // The pipe lookup skips comments, so a note written before it would go with the splice: fix no gap.
          if (!gapIsBlank(sourceCode, tokenBeforePipe.range[1], pipe.range[0])) {
            return null;
          }

          gaps.push([tokenBeforePipe.range[1], pipe.range[0]]);
        }
      }

      const indent = continuationIndent(node, mustFind(types[0]));

      return (fixer) => {
        return gaps
          .map((gap) => {
            return fixer.replaceTextRange(gap, `${eol}${indent}`);
          });
      };
    };

    const visitors: Rule.RuleListener = {
      TSUnionType: (node: UnionTypeNode) => {
        const types = mustFind(node.types);
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

    return visitors;
  },
});
