import { physicalFilenameOf, sourceCodeOf } from '../../utils/compatUtils.ts';
import { lineTerminatorOf } from '../../utils/layoutUtils.ts';
import {
  createRule,
  type Fixer,
  mustFind,
  rangeOf,
  type RuleContext,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

type CommentNode = ReturnType<SourceCode['getAllComments']>[number];

interface LineEntry {
  comment: CommentNode;
  indent: string;
  text: string;
}

// Three slashes is where the shipped standard moves a note into JSDoc.
const MIN_JSDOC_LINES = 3;

// Directives are machine-addressed, so they are never rewritten. Two patterns: the single regex was over the
// complexity limit.
const DIRECTIVE_OPENER = /^#!|^\/\/\/\s*<reference\b/;
const DIRECTIVE_KEYWORD = /^\/\/\s*(?:eslint-\w+|@?ts-\w+|[vc]8 ignore|istanbul ignore|prettier-ignore)\b/;

// Test files carry no comments at all under the shipped standard, which is a different rule's business.
const TEST_FILE_PATTERN = /(?:^|[/\\.])(?:test|spec)\.[cm]?[jt]sx?$|(?:^|[/\\])__tests__(?:[/\\]|$)/;

/**
 * A tag makes the block machine-read rather than prose, and every reader of one stops at `/**`: `@type` in a
 * checked `.js` file is the annotation itself, `@jsxImportSource` is a pragma TypeScript takes from a block
 * comment only, and `@deprecated` on a `//` line strikes nothing through.
 */
const JSDOC_TAG = /(^|\s)@[a-z]/i;

const isDirective = (raw: string): boolean => {
  return DIRECTIVE_OPENER.test(raw) || DIRECTIVE_KEYWORD.test(raw);
};

// Content lines between the delimiters, the leading star stripped off each continuation line.
const jsdocBodyOf = (comment: CommentNode): string[] => {
  const lines = comment.value.split('\n').map((line) => {
    const trimmed = line.trim();

    return trimmed.startsWith('*') ? trimmed.slice(1).trim() : trimmed;
  });

  while (lines[0] === '') {
    lines.shift();
  }

  while (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
};

// Null unless the comment is the only thing on every line it touches; the line's indent comes back with it.
const wholeLineIndentOf = (sourceCode: SourceCode, comment: CommentNode): string | null => {
  const [start, end] = rangeOf(comment);
  const { text } = sourceCode;
  // Searching from `start` itself is safe: that character opens the comment and is never a line break.
  const lineStart = text.lastIndexOf('\n', start) + 1;

  if (text.slice(lineStart, start).trim() !== '') {
    return null;
  }

  const newlineAfter = text.indexOf('\n', end);
  const lineEnd = newlineAfter === -1 ? text.length : newlineAfter;

  return text.slice(end, lineEnd).trim() === '' ? text.slice(lineStart, start) : null;
};

// Both replacements begin where the original comment began, so the line's own indent is already
// outside the range and only continuation lines carry it.
const slashTextFor = (indent: string, body: string[], eol: string): string => {
  return body
    .map((line, index) => {
      return `${index === 0 ? '' : indent}// ${line}`.trimEnd();
    })
    .join(eol);
};

const jsdocTextFor = (indent: string, contents: string[], eol: string): string => {
  return [
    '/**',
    ...contents.map((line) => {
      return `${indent} * ${line}`.trimEnd();
    }),
    `${indent} */`,
  ].join(eol);
};

// Adjacent when one line break separates the two, and since both hold their lines alone, the rest is indent. Read
// off the text rather than off `loc`, which ESTree types as nullable and a comment cannot be trusted to carry.
const isAdjacent = (sourceCode: SourceCode, previous: LineEntry, comment: CommentNode): boolean => {
  return sourceCode.text.slice(rangeOf(previous.comment)[1], rangeOf(comment)[0]).split('\n').length === 2;
};

// Null for anything that cannot join a run: a block comment, a directive, or a `//` sharing its line with code.
const lineEntryOf = (sourceCode: SourceCode, comment: CommentNode, raw: string): LineEntry | null => {
  if (comment.type !== 'Line' || isDirective(raw)) {
    return null;
  }

  const indent = wholeLineIndentOf(sourceCode, comment);

  return indent === null
    ? null
    : {
        comment,
        indent,
        text: raw.slice(2).trim(),
      };
};

const reportRun = (context: RuleContext, run: LineEntry[], eol: string): void => {
  if (run.length < MIN_JSDOC_LINES) {
    return;
  }

  const first = mustFind(run[0], 'the first comment of a run');
  const last = mustFind(run[run.length - 1], 'the last comment of a run');

  // A `//` line can hold `*/` as plain text; a `/** */` block cannot, since that sequence closes it wherever it
  // falls. Merging a run that carries one would truncate the block early and spill the rest as code.
  if (run.some((entry) => {
    return entry.text.includes('*/');
  })) {
    return;
  }

  context.report({
    node: first.comment,
    messageId: 'useJsdoc',
    fix: (fixer: Fixer) => {
      return fixer.replaceTextRange([rangeOf(first.comment)[0], rangeOf(last.comment)[1]], jsdocTextFor(
        first.indent,
        run.map((entry) => {
          return entry.text;
        }),
        eol,
      ));
    },
  });
};

// A no-op unless the comment is a JSDoc block short enough that the standard wants `//` lines instead.
const reportShortJsdoc = (
  context: RuleContext,
  sourceCode: SourceCode,
  comment: CommentNode,
  raw: string,
  eol: string,
): void => {
  // Only a block's raw text can open `/**`: a line comment opens `//` and a shebang `#!`.
  if (!raw.startsWith('/**')) {
    return;
  }

  const body = jsdocBodyOf(comment);
  const indent = wholeLineIndentOf(sourceCode, comment);

  // An empty body cannot happen in source that parses, and three content lines is JSDoc already.
  if (indent === null || body.length === 0 || body.length >= MIN_JSDOC_LINES) {
    return;
  }

  if (body.some((line) => {
    return JSDOC_TAG.test(line);
  })) {
    return;
  }

  context.report({
    node: comment,
    messageId: 'useSlashes',
    fix: (fixer: Fixer) => {
      return fixer.replaceTextRange(rangeOf(comment), slashTextFor(indent, body, eol));
    },
  });
};

export const commentDelimiter = createRule('comment-delimiter', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Use `//` for short comments and JSDoc blocks for longer prose.',
    },
    fixable: 'code',
    messages: {
      useSlashes: 'Use `//` lines for a JSDoc block of one or two lines.',
      useJsdoc: 'Use one `/** */` block for three or more consecutive `//` lines.',
    },
    schema: [],
  },
  create: (context) => {
    if (TEST_FILE_PATTERN.test(physicalFilenameOf(context))) {
      return {};
    }

    const sourceCode = sourceCodeOf(context);
    const eol = lineTerminatorOf(sourceCode);

    return {
      Program: () => {
        // One maximal run of adjacent whole-line `//` comments, flushed whenever anything breaks its adjacency.
        let run: LineEntry[] = [];

        const flush = (): void => {
          reportRun(context, run, eol);
          run = [];
        };

        for (const comment of sourceCode.getAllComments()) {
          const [start, end] = rangeOf(comment);
          const raw = sourceCode.text.slice(start, end);
          const entry = lineEntryOf(sourceCode, comment, raw);

          // No flush here: whatever comment this is, it sits between the run and the next entry, so that entry is
          // not adjacent and breaks the run itself.
          if (entry === null) {
            reportShortJsdoc(context, sourceCode, comment, raw, eol);
            continue;
          }

          const previous = run[run.length - 1];

          if (previous !== undefined && !isAdjacent(sourceCode, previous, comment)) {
            flush();
          }

          run.push(entry);
        }

        flush();
      },
    };
  },
});
