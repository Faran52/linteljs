import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import { adjacentPairs, lineTerminatorOf } from '../../utils/layoutUtils.ts';
import {
  rangeOf,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

// What a `Program` holds. Wider than `Statement[]`: a directive is its own type.
type ProgramEntry = Extract<RuleNode, { type: 'Program' }>['body'][number];

// One misplaced declaration: the text to re-insert, and the span to delete.
interface TypeCut {
  node: ProgramEntry;
  text: string;
  removeRange: [number, number];
}

const readText = (entry: { text: string }): string => {
  return entry.text;
};

// One place for the optional-location fallback, rather than one at every read.
const startLineOf = (node: { loc?: { start: { line: number } }
  | null
  | undefined; }): number => {
  /* v8 ignore next 1 -- every parsed node and comment carries a location */
  return node.loc?.start.line ?? 0;
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

/**
 * A 'use client'/'use strict' prologue counts only while nothing precedes it, which is what Next.js reads to pick a
 * Client Component. Every ExpressionStatement carries a directive key, undefined for non-directives, so narrowing
 * needs `object`, not the declared type.
 */
const directiveOf = (node: object): string | undefined => {
  return 'directive' in node && typeof node.directive === 'string' ? node.directive : undefined;
};

const isDirective = (node: ProgramEntry): boolean => {
  return node.type === 'ExpressionStatement' && directiveOf(node) !== undefined;
};

// The last index satisfying a predicate. `Array.prototype.findLastIndex` is Node 18.
const lastIndexWhere = <T>(items: T[], matches: (item: T) => boolean): number => {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (item !== undefined && matches(item)) {
      return index;
    }
  }

  return -1;
};

// The header a moved block must land below: the directive prologue, then any imports.
const findHeaderEndIndex = (body: ProgramEntry[]): number => {
  return lastIndexWhere(body, (statement) => {
    return statement.type === 'ImportDeclaration' || isDirective(statement);
  });
};

const findFirstRuntimeIndex = (body: ProgramEntry[], afterIndex: number): number => {
  // -1 for no match is what the caller checks.
  return body.findIndex((entry, index) => {
    return index > afterIndex && !isTypeDeclaration(entry);
  });
};

// Everything between the header and the first runtime node is a type declaration by definition, so the anchor is the
// entry before it.
const findInsertionIndex = (headerEndIndex: number, firstRuntimeIndex: number): number => {
  return Math.max(headerEndIndex, firstRuntimeIndex - 1);
};

// A trailing note travels with the statement it follows; cutting at the declaration's own end would leave it for the
// next statement to slide under.
const trailingNoteOf = (sourceCode: SourceCode, node: ProgramEntry): [number, number] | undefined => {
  const [note] = sourceCode.getCommentsAfter(node);

  if (!note) {
    return undefined;
  }

  // A token's location is always present, where a node's is optional in the type.
  const before = sourceCode.getTokenBefore(note);

  return before?.loc.end.line === startLineOf(note) ? note.range : undefined;
};

/**
 * Deletion starts after whatever precedes it, so the blank line goes too but a trailing comment above stays put.
 * `getCommentsBefore` starts at that statement's last token, so a trailing `// why` arrives alongside the
 * declaration's own heading comments; the line split sorts which travel.
 */
const cutFor = (sourceCode: SourceCode, typeNode: ProgramEntry, previous: ProgramEntry): TypeCut => {
  /* v8 ignore next 1 -- every parsed node carries a location */
  const previousEndLine = previous.loc?.end.line ?? -1;
  const between = sourceCode.getCommentsBefore(typeNode);

  const firstOwned = between.find((comment) => {
    return startLineOf(comment) > previousEndLine;
  });
  const staysBehind = between.filter((comment) => {
    return startLineOf(comment) <= previousEndLine;
  });
  const lastRetained = staysBehind[staysBehind.length - 1];

  const [startPos] = rangeOf(firstOwned ?? typeNode);
  const noteRange = trailingNoteOf(sourceCode, typeNode);
  const endPos = noteRange ? noteRange[1] : rangeOf(typeNode)[1];

  // `range` is present on every parsed node and comment, so only the fallback chains are real branches here.
  const precedingEnd = lastRetained?.range?.[1] ?? previous.range?.[1];

  /* v8 ignore next 1 -- a misplaced type always has a parsed sibling before it */
  const removalStart = precedingEnd ?? startPos;

  return {
    node: typeNode,
    text: sourceCode.text.slice(startPos, endPos),
    removeRange: [removalStart, endPos],
  };
};

// All are safe to move, `typeof` included: TypeScript resolves type positions lazily. The walk is
// pairwise so removal range is never read from a possibly-missing `body[index - 1]`.
const cutsFor = (sourceCode: SourceCode, body: ProgramEntry[], firstRuntimeIndex: number): TypeCut[] => {
  const cuts: TypeCut[] = [];

  for (const [[, previous], [index, candidate]] of adjacentPairs([...body.entries()])) {
    if (index > firstRuntimeIndex && isTypeDeclaration(candidate)) {
      cuts.push(cutFor(sourceCode, candidate, previous));
    }
  }

  return cuts;
};

export const interfaceOrder = createRule('interface-order', {
  meta: {
    type: 'layout',
    docs: {
      category: 'ordering',
      language: 'typescript',
      // Off by default: the only rule that relocates declarations, and comment placement is a judgement call no rule
      // can make reliably.
      recommended: false,
      description: 'Keep top-level interfaces and type aliases together, after imports and before runtime code.',
    },
    fixable: 'code',
    messages: {
      moveAfterImports:
        'Top-level type/interface declarations must be placed after imports, before runtime code.',
    },
    schema: [],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const eol = lineTerminatorOf(sourceCode);

    return {
      // `node` infers as `Program` already; intersecting the whole node union with a `body` shape distributes over
      // every member and needs a cast to undo.
      'Program:exit': (node) => {
        const { body } = node;
        // Destructured rather than read back as `body[0]` in the fixer, which would re-answer the empty-program case.
        const [firstStatement] = body;

        if (!firstStatement) {
          return;
        }

        const headerEndIndex = findHeaderEndIndex(body);
        const firstRuntimeIndex = findFirstRuntimeIndex(body, headerEndIndex);

        if (firstRuntimeIndex === -1) {
          return;
        }

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
            const joinedTypes = cuts.map(readText).join(`${eol}${eol}`);

            if (insertAfterNode) {
              // After the anchor's own trailing note, not between the two.
              const anchorNote = trailingNoteOf(sourceCode, insertAfterNode);
              const block = `${eol}${eol}` + joinedTypes;

              yield anchorNote
                ? fixer.insertTextAfterRange(anchorNote, block)
                : fixer.insertTextAfter(insertAfterNode, block);
            }
            else {
              // No header, so the block goes above the first statement's own comments; inserting at the node would
              // detach a JSDoc from it.
              const leading = sourceCode.getCommentsBefore(firstStatement);
              const anchor = leading[0] ?? firstStatement;

              yield fixer.insertTextBefore(anchor, joinedTypes + `${eol}${eol}`);
            }

            for (const { removeRange } of cuts) {
              yield fixer.removeRange(removeRange);
            }
          },
        });
      },
    };
  },
});
