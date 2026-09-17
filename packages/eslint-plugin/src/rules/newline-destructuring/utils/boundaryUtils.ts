// Where a member begins and ends once surrounding comments are counted, and what that says
// about the block's layout. `index.ts` decides and fixes; nothing here reports.
import { adjacentPairs, sameLine } from '../../../utils/layoutUtils.ts';

import type { RuleNode, SourceCode } from '../../../utils/ruleUtils.ts';

// The location every reader needs; `loc` is optional on ESTree nodes, so stating it once avoids per-reader fallbacks.
export type PropertyNode = RuleNode & {
  type: string;
  loc: {
    start: { line: number };
    end: { line: number };
  };
};

export interface PatternAnalysis {
  isMultiLine: boolean;
  hasSameLinePairs: boolean;
  hasBlankBetween: boolean;
  hasMultilineProperty: boolean;
}

// The comments above a member, not the trailing comment of the member before it: `getCommentsBefore`
// returns both, so a same-line note would otherwise be misattributed.
const leadingCommentsOf = (sourceCode: SourceCode, member: RuleNode) => {
  return sourceCode.getCommentsBefore(member).filter((comment) => {
    const previousToken = sourceCode.getTokenBefore(comment);

    // A brace has nothing to trail, so a comment written straight after `{` heads the first member.
    return previousToken?.value === '{' || !sameLine(previousToken, comment);
  });
};

// A member's first line, counting a doc comment above it as its own rather than as a blank line above the member.
const startLineOf = (sourceCode: SourceCode, member: PropertyNode): number => {
  const [comment] = leadingCommentsOf(sourceCode, member);

  return comment?.loc ? comment.loc.start.line : member.loc.start.line;
};

// Where a splice moving a member down cuts in: before its heading comment, not between the comment and the member.
export const startTokenOf = (sourceCode: SourceCode, member: RuleNode) => {
  const [comment] = leadingCommentsOf(sourceCode, member);

  return comment ?? sourceCode.getFirstToken(member);
};

// Where a member ends, counting a trailing same-line note so the newline goes after it, not in front of it.
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

// How the block is laid out, read off its members' boundaries; both fix strategies and the report ladder use it.
export const analyzeProperties = (
  sourceCode: SourceCode,
  properties: PropertyNode[],
): PatternAnalysis => {
  const result: PatternAnalysis = {
    isMultiLine: false,
    hasSameLinePairs: false,
    hasBlankBetween: false,
    // Every member, not only the ones the pairwise walk below reaches as `current`: a block
    // whose last member spans lines is as open as one whose first does.
    hasMultilineProperty: properties.some((property) => {
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
