import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  adjacentPairs,
  getIndent,
  lineTerminatorOf,
  type Located,
} from '../../utils/layoutUtils.ts';
import {
  isDirective,
  mustFind,
  optionsOf,
  rangeOf,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

// The matcher `Extract` reads, named because this workspace writes no object type inline.
interface ProgramNode {
  type: 'Program';
}

type ProgramEntry = Extract<RuleNode, ProgramNode>['body'][number];

// A `<script>` under svelte-eslint-parser, which holds the statements `Program.body` holds under every other parser.
interface ScriptElement {
  body: ProgramEntry[];
}

interface TypeCut {
  node: ProgramEntry;
  text: string;
  removeRange: [number, number];
}

interface InterfaceOrderOptions {
  trimBlankLines: boolean;
}

interface Texted {
  text: string;
}

const readText = (entry: Texted): string => {
  return entry.text;
};

// A line holding only indentation, which an editor leaves behind in a blank line and a move would carry along.
const WHITESPACE_LINE = /^[\t ]+$/gmu;

const startLineOf = (node: Located): number => {
  return mustFind(node.loc, 'the location of a declaration').start.line;
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
  // Reversed and found rather than `findLastIndex`, which needs Node 18 and this package declares a floor of 14.
  const fromEnd = [...body].reverse().findIndex((statement) => {
    return statement.type === 'ImportDeclaration' || isDirective(statement);
  });

  return fromEnd === -1 ? -1 : body.length - 1 - fromEnd;
};

const findFirstRuntimeIndex = (body: ProgramEntry[], afterIndex: number): number => {
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

  // A comment after a node always has that node's last token before it, and a token's location is always present.
  const before = mustFind(sourceCode.getTokenBefore(note), 'the token before a trailing comment');

  return before.loc.end.line === startLineOf(note) ? note.range : undefined;
};

// Cut from the end of the previous entry, so the blank line goes and a trailing note above stays; `getCommentsBefore`
// hands back that note beside the declaration's own heading comments, and the line split sorts which travel.
const cutFor = (sourceCode: SourceCode, typeNode: ProgramEntry, previous: ProgramEntry): TypeCut => {
  const previousEndLine = mustFind(previous.loc, 'the location of the previous declaration').end.line;
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

  return {
    node: typeNode,
    text: sourceCode.text.slice(startPos, endPos),
    removeRange: [rangeOf(lastRetained ?? previous)[1], endPos],
  };
};

// All are safe to move, `typeof` included: TypeScript resolves type positions lazily. The walk is
// pairwise so removal range is never read from a possibly-missing `body[index - 1]`.
const cutsFor = (sourceCode: SourceCode, body: ProgramEntry[], firstRuntimeIndex: number): TypeCut[] => {
  const cuts: TypeCut[] = [];

  // From the first runtime statement on, so every candidate sits after it and the header stays where it is. With no
  // runtime statement the index is -1 and the slice is the last entry alone, which pairs with nothing.
  for (const [previous, candidate] of adjacentPairs(body.slice(firstRuntimeIndex))) {
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
      // On by default from 2.0. It is still the only rule that relocates declarations, and comment placement is
      // still a judgement call, which is why the fix is `reorder` and why it reports rather than rewrites freely.
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
    // What a moved declaration is written back as: its own text, with blank lines emptied unless asked otherwise.
    const movedText = (entry: Texted): string => {
      const text = readText(entry);

      return trimBlankLines ? text.replace(WHITESPACE_LINE, '') : text;
    };

    // One statement list: the program's, or one Svelte `<script>`'s.
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
          // A cut means a runtime statement exists, so the list has a first statement. Its indent is the list's: none
          // in a script file, and whatever the `<script>` body is written at in a component.
          const first = mustFind(firstStatement, 'the first statement of the list');
          const indent = getIndent(sourceCode, first);
          const joinedTypes = cuts.map(movedText).join(`${eol}${eol}${indent}`);

          if (insertAfterNode) {
            // After the anchor's own trailing note, not between the two.
            const anchorNote = trailingNoteOf(sourceCode, insertAfterNode);
            const block = `${eol}${eol}${indent}` + joinedTypes;

            yield anchorNote
              ? fixer.insertTextAfterRange(anchorNote, block)
              : fixer.insertTextAfter(insertAfterNode, block);
          }
          else {
            // No header, so the block goes above the first statement's own comments, since inserting at the node
            // would detach a JSDoc from it.
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

    return {
      // `node` infers as `Program` already; intersecting the whole node union with a `body` shape distributes over
      // every member and needs a cast to undo.
      'Program:exit': (node) => {
        check(node.body);
      },

      // svelte-eslint-parser puts each `<script>` in `Program.body` as an element, so the list above holds no
      // declaration at all there and the rule said nothing about a Svelte component.
      'SvelteScriptElement:exit': (node: ScriptElement) => {
        check(node.body);
      },
    };
  },
});
