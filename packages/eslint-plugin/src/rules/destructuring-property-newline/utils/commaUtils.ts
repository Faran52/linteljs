import { commaToNewline, gapIsBlank } from '../../../utils/layoutUtils.ts';
import {
  type Fixer,
  mustFind,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

import type { AST, Rule } from 'eslint';

// Null when anything is written in the gap: reflowing over a comment would delete it.
export const fixCommaToNewline = (
  sourceCode: SourceCode,
  fixer: Fixer,
  currentToken: AST.Token,
  indent: string,
): Rule.Fix | null => {
  const comma = mustFind(sourceCode.getTokenBefore(currentToken));

  if (!gapIsBlank(sourceCode, comma.range[1], currentToken.range[0])) {
    return null;
  }

  return commaToNewline(sourceCode, fixer, currentToken, indent);
};
