import { createRule } from '../../types.ts';
import { physicalFilenameOf, sourceCodeOf } from '../../utils/compatUtils.ts';
import { lineTerminatorOf } from '../../utils/layoutUtils.ts';
import {
  type Fixer,
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

/**
 * Directives are machine-addressed, not prose: rewriting one breaks what points at it. Two patterns rather than one
 * alternation, because an opener is matched from the first character and a keyword from after the slashes, and the
 * single regex that did both was past the complexity this repo allows.
 */
const DIRECTIVE_OPENER = /^#!|^\/\/\/\s*<reference\b/;
const DIRECTIVE_KEYWORD = /^\/\/\s*(?:eslint-\w+|@?ts-\w+|[vc]8 ignore|istanbul ignore|prettier-ignore)\b/;

// Test files carry no comments at all under the shipped standard, which is a different rule's business.
const TEST_FILE_PATTERN = /(?:^|[/\\.])(?:test|spec)\.[cm]?[jt]sx?$|(?:^|[/\\])__tests__(?:[/\\]|$)/;

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
  const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;

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

// Adjacent when exactly one line break separates the two comments and nothing else does. Read off the text rather
// than off `loc`, which ESTree types as nullable and a comment therefore cannot be trusted to carry.
const isAdjacent = (sourceCode: SourceCode, previous: LineEntry, comment: CommentNode): boolean => {
  const between = sourceCode.text.slice(rangeOf(previous.comment)[1], rangeOf(comment)[0]);

  return between.trim() === '' && between.split('\n').length === 2;
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
  const [first] = run;
  const last = run[run.length - 1];

  if (first === undefined || last === undefined || run.length < MIN_JSDOC_LINES) {
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
  if (comment.type !== 'Block' || !raw.startsWith('/**')) {
    return;
  }

  const body = jsdocBodyOf(comment);
  const indent = wholeLineIndentOf(sourceCode, comment);

  // An empty body cannot happen in source that parses, and three content lines is JSDoc already.
  if (indent === null || body.length === 0 || body.length >= MIN_JSDOC_LINES) {
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
      category: 'layout',
      language: 'universal',
      recommended: true,
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

          if (entry === null) {
            flush();
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
