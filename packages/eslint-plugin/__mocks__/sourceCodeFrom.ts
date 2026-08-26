import { Linter } from 'eslint';

import type { Rule } from 'eslint';
import type { RuleNode, SourceCode } from '../src/utils/ruleUtils.ts';

// A real `SourceCode` for a snippet: there is no public constructor, so this runs a throwaway rule to capture one.
export interface ParsedSnippet {
  sourceCode: SourceCode;
  // The first node of the requested type, for helpers that take one.
  firstNode: (type: string) => RuleNode;
  // The last node of the requested type, for reaching the inner half of a nested pair.
  lastNode: (type: string) => RuleNode;
}

export const sourceCodeFrom = (code: string): ParsedSnippet => {
  const linter = new Linter();
  const nodes: RuleNode[] = [];
  let captured: SourceCode | undefined;

  // Annotated rather than inferred: inference would narrow `context` to less
  // than the `Rule.RuleModule` a flat config expects.
  const capture: Rule.RuleModule = {
    create: (context) => {
      captured = context.sourceCode;

      return {
        '*': (node: RuleNode) => {
          nodes.push(node);
        },
      };
    },
  };

  linter.verify(code, [
    {
      plugins: { probe: { rules: { capture } } },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: { 'probe/capture': 'error' },
    },
  ]);

  if (!captured) {
    throw new Error(`snippet did not parse: ${code}`);
  }

  const sourceCode = captured;

  const of = (found: RuleNode | undefined, type: string): RuleNode => {
    if (!found) {
      throw new Error(`no ${type} in snippet`);
    }

    return found;
  };

  return {
    sourceCode,
    firstNode: (type: string): RuleNode => {
      return of(nodes.find((node) => {
        return node.type === type;
      }), type);
    },
    lastNode: (type: string): RuleNode => {
      return of(nodes.findLast((node) => {
        return node.type === type;
      }), type);
    },
  };
};
