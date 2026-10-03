import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  getIndent,
  linesInsideTokens,
  lineTerminatorOf,
  type Located,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  isDirective,
  mustFind,
  optionsOf,
  rangeOf,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface ProgramNode {
  type: 'Program';
}

type ProgramEntry = Extract<RuleNode, ProgramNode>['body'][number];

// svelte-eslint-parser holds a `<script>`'s statements here, not in `Program.body`.
interface ScriptElement {
  body: ProgramEntry[];
}

interface TypeCut {
  node: ProgramEntry;
  startLine: number;
  text: string;
  removeRange: [number, number];
}

interface InterfaceOrderOptions {
  trimBlankLines: boolean;
}

// An editor leaves this in a blank line, and a move would carry it along. The lookahead keeps a CRLF line ending.
const WHITESPACE_LINE = /^[\t ]+(?=\r?$)/u;

const startLineOf = (node: Located): number => {
  return mustFind(node.loc).start.line;
};

const TYPE_DECLARATION_TYPES = new Set(['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']);

const isTypeDeclaration = (node: ProgramEntry): boolean => {
  if (TYPE_DECLARATION_TYPES.has(node.type)) {
    return true;
  }

  if (node.type === 'ExportNamedDeclaration') {
    const { declaration } = node;
    const hasDeclaration = declaration?.type && TYPE_DECLARATION_TYPES.has(declaration.type);
    return Boolean(hasDeclaration);
  }

  return false;
};

const findHeaderEndIndex = (body: ProgramEntry[]): number => {
  // Not `findLastIndex`: `src/` is held to the ES2022 built-ins.
  const fromEnd = [...body]
    .reverse()
    .findIndex((statement) => {
      return statement.type === 'ImportDeclaration' || isDirective(statement);
    });

  return fromEnd === -1 ? -1 : body.length - 1 - fromEnd;
};

const findFirstRuntimeIndex = (body: ProgramEntry[], afterIndex: number): number => {
  return body
    .findIndex((entry, index) => {
      return index > afterIndex && !isTypeDeclaration(entry);
    });
};

const findInsertionIndex = (headerEndIndex: number, firstRuntimeIndex: number): number => {
  return Math.max(headerEndIndex, firstRuntimeIndex - 1);
};

// Cutting at the declaration's own end would leave its trailing note for the next statement.
const trailingNoteOf = (sourceCode: SourceCode, node: ProgramEntry): [number, number] | undefined => {
  const [note] = sourceCode.getCommentsAfter(node);

  if (!note) {
    return undefined;
  }

  // A comment after a node always has that node's last token before it.
  const before = mustFind(sourceCode.getTokenBefore(note));

  return before.loc.end.line === startLineOf(note) ? note.range : undefined;
};

// Cut from the end of the previous entry, so the blank line goes and a trailing note above stays.
const cutFor = (sourceCode: SourceCode, typeNode: ProgramEntry, previous: ProgramEntry): TypeCut => {
  const previousEndLine = mustFind(previous.loc).end.line;
  const between = sourceCode.getCommentsBefore(typeNode);

  const firstOwned = between
    .find((comment) => {
      return startLineOf(comment) > previousEndLine;
    });
  const staysBehind = between
    .filter((comment) => {
      return startLineOf(comment) <= previousEndLine;
    });
  const lastRetained = staysBehind[staysBehind.length - 1];

  const [startPos] = rangeOf(firstOwned ?? typeNode);
  const noteRange = trailingNoteOf(sourceCode, typeNode);
  const endPos = noteRange ? noteRange[1] : rangeOf(typeNode)[1];

  const cut: TypeCut = {
    node: typeNode,
    startLine: sourceCode.getLocFromIndex(startPos).line,
    text: sourceCode.text.slice(startPos, endPos),
    removeRange: [rangeOf(lastRetained ?? previous)[1], endPos],
  };

  return cut;
};

// `typeof` is safe to move too: TypeScript resolves type positions lazily.
const cutsFor = (sourceCode: SourceCode, body: ProgramEntry[], firstRuntimeIndex: number): TypeCut[] => {
  const cuts: TypeCut[] = [];

  // With no runtime statement the index is -1 and the slice is the last entry alone, which pairs with nothing.
  const runtimeOnward = body.slice(firstRuntimeIndex);

  for (const [previous, candidate] of adjacentPairs(runtimeOnward)) {
    if (isTypeDeclaration(candidate)) {
      cuts.push(cutFor(sourceCode, candidate, previous));
    }
  }

  return cuts;
};

export const interfaceOrder = createRule('interface-order', {
  meta: {
    type: 'layout',
    docs: {
      language: 'typescript',
      // Comment placement is a judgement call, so the fix is `reorder`.
      recommended: true,
      fixShape: 'reorder',
      description: 'Keep top-level interfaces and type aliases together, after imports and before runtime code.',
    },
    fixable: 'code',
    messages: {
      moveAfterImports:
        'Top-level type/interface declarations must be placed after imports, before runtime code.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          trimBlankLines: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const eol = lineTerminatorOf(sourceCode);
    const trimBlankLines = optionsOf<InterfaceOrderOptions>(context).trimBlankLines ?? true;

    const insideTokens = linesInsideTokens(sourceCode);

    // A line inside a token is content: a template literal type keeps its whitespace lines.
    const movedText = ({ startLine, text }: TypeCut): string => {
      if (!trimBlankLines) {
        return text;
      }

      return text
        .split('\n')
        .map((line, index) => {
          return insideTokens.has(startLine + index) ? line : line.replace(WHITESPACE_LINE, '');
        })
        .join('\n');
    };

    const check = (body: ProgramEntry[]): void => {
      const [firstStatement] = body;
      const headerEndIndex = findHeaderEndIndex(body);
      const firstRuntimeIndex = findFirstRuntimeIndex(body, headerEndIndex);
      const cuts = cutsFor(sourceCode, body, firstRuntimeIndex);
      const [firstCut] = cuts;

      if (!firstCut) {
        return;
      }

      const insertAfterNode = body[findInsertionIndex(headerEndIndex, firstRuntimeIndex)];

      context.report({
        node: firstCut.node,
        messageId: 'moveAfterImports',
        * fix(fixer) {
          // A cut means a runtime statement exists, so the list has a first statement.
          const first = mustFind(firstStatement);
          const indent = getIndent(sourceCode, first);
          const joinedTypes = cuts
            .map(movedText)
            .join(`${eol}${eol}${indent}`);

          if (insertAfterNode) {
            const anchorNote = trailingNoteOf(sourceCode, insertAfterNode);
            const block = `${eol}${eol}${indent}` + joinedTypes;

            yield anchorNote
              ? fixer.insertTextAfterRange(anchorNote, block)
              : fixer.insertTextAfter(insertAfterNode, block);
          }
          else {
            // Inserting at the node would detach a JSDoc from it.
            const leading = sourceCode.getCommentsBefore(first);
            const anchor = leading[0] ?? first;

            yield fixer.insertTextBefore(anchor, joinedTypes + `${eol}${eol}${indent}`);
          }

          for (const { removeRange } of cuts) {
            yield fixer.removeRange(removeRange);
          }
        },
      });
    };

    const visitors: Rule.RuleListener = {
      // Intersecting the node union with a `body` shape distributes and needs a cast to undo.
      'Program:exit': (node) => {
        check(node.body);
      },

      'SvelteScriptElement:exit': (node: ScriptElement) => {
        check(node.body);
      },
    };

    return visitors;
  },
});
