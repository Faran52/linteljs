import { adjacentPairs, sameLine } from '../../../utils/layoutUtils.ts';
import {
  mustFind,
  type NodeLocation,
  type RuleNode,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

interface Placed {
  type: string;
  loc: NodeLocation;
}

// `loc` is optional on ESTree nodes, so stating it once avoids per-reader fallbacks.
export type PropertyNode = RuleNode & Placed;

export interface PatternAnalysis {
  isMultiLine: boolean;
  hasSameLinePairs: boolean;
  hasBlankBetween: boolean;
  hasMultilineProperty: boolean;
}

// `getCommentsBefore` also returns the previous member's trailing note.
const leadingCommentsOf = (sourceCode: SourceCode, member: RuleNode) => {
  return sourceCode
    .getCommentsBefore(member)
    .filter((comment) => {
      const previousToken = mustFind(
        sourceCode.getTokenBefore(comment),
        'the token before a comment above a type member',
      );

      // A brace has nothing to trail, so a note straight after `{` heads the first member.
      return previousToken.value === '{' || !sameLine(previousToken, comment);
    });
};

const startLineOf = (sourceCode: SourceCode, member: PropertyNode): number => {
  const [comment] = leadingCommentsOf(sourceCode, member);

  return comment?.loc ? comment.loc.start.line : member.loc.start.line;
};

export const startTokenOf = (sourceCode: SourceCode, member: RuleNode) => {
  const [comment] = leadingCommentsOf(sourceCode, member);

  return comment ?? sourceCode.getFirstToken(member);
};

export const endTokenOf = (sourceCode: SourceCode, member: RuleNode) => {
  const lastToken = sourceCode.getLastToken(member);
  let trailing;

  for (const comment of sourceCode.getCommentsAfter(member)) {
    if (!sameLine(lastToken, comment)) {
      break;
    }

    trailing = comment;
  }

  return trailing ?? lastToken;
};

export const analyzeProperties = (
  sourceCode: SourceCode,
  properties: PropertyNode[],
): PatternAnalysis => {
  const result: PatternAnalysis = {
    isMultiLine: false,
    hasSameLinePairs: false,
    hasBlankBetween: false,
    hasMultilineProperty: properties
      .some((property) => {
        return property.loc.end.line !== property.loc.start.line;
      }),
  };

  for (const [previous, property] of adjacentPairs(properties)) {
    const nextStart = startLineOf(sourceCode, property);

    if (nextStart === previous.loc.end.line) {
      result.hasSameLinePairs = true;
    }
    else {
      result.isMultiLine = true;
    }

    if (nextStart > previous.loc.end.line + 1) {
      result.hasBlankBetween = true;
    }
  }

  return result;
};
