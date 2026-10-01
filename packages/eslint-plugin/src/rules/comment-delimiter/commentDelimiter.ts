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

// Directives are machine-addressed, so never rewritten or joined into a block. Three patterns for the complexity limit.
const DIRECTIVE_OPENER = /^#!|^\/\/\/\s*<reference\b/;
const DIRECTIVE_KEYWORD = /^\/\/\s*(?:eslint-\w+|@?ts-\w+|[vc]8 ignore|istanbul ignore|prettier-ignore)\b/;
const SOURCE_MAP = /^\/\/\s*[#@]\s*source(?:Mapping)?URL=/;

// Test files carry no comments at all, which is a different rule's business.
const TEST_FILE_PATTERN = /(?:^|[/\\.])(?:test|spec)\.[cm]?[jt]sx?$|(?:^|[/\\])__tests__(?:[/\\]|$)/;

// Every reader of a tagged block stops at `/**`: a pragma or type annotation in a `//` line is inert.
const JSDOC_TAG = /(^|\s)@[a-z]/i;

const isDirective = (raw: string): boolean => {
  return DIRECTIVE_OPENER.test(raw) || DIRECTIVE_KEYWORD.test(raw) || SOURCE_MAP.test(raw);
};

const jsdocBodyOf = (comment: CommentNode): string[] => {
  const lines = comment.value
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      return trimmed.startsWith('*')
        ? trimmed
            .slice(1)
            .trim()
        : trimmed;
    });

  const body = lines
    .join('\n')
    .trim();

  return body === '' ? [] : body.split('\n');
};

// Null unless the comment is alone on every line it touches.
const wholeLineIndentOf = (sourceCode: SourceCode, comment: CommentNode): string | null => {
  const [start, end] = rangeOf(comment);
  const { text } = sourceCode;
  // Searching from `start` itself is safe: that character opens the comment and is never a line break.
  const lineStart = text.lastIndexOf('\n', start) + 1;

  if (text
    .slice(lineStart, start)
    .trim() !== '') {
    return null;
  }

  const newlineAfter = text.indexOf('\n', end);
  const lineEnd = newlineAfter === -1 ? text.length : newlineAfter;

  return text
    .slice(end, lineEnd)
    .trim() === ''
    ? text.slice(lineStart, start)
    : null;
};

// Both replacements begin where the original did, so only continuation lines carry the indent.
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
    ...contents
      .map((line) => {
        return `${indent} * ${line}`.trimEnd();
      }),
    `${indent} */`,
  ].join(eol);
};

// Read off the text rather than `loc`, which ESTree types as nullable.
const isAdjacent = (sourceCode: SourceCode, previous: LineEntry, comment: CommentNode): boolean => {
  return sourceCode.text
    .slice(rangeOf(previous.comment)[1], rangeOf(comment)[0])
    .split('\n').length === 2;
};

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
        text: raw
          .slice(2)
          .trim(),
      };
};

const reportRun = (context: RuleContext, run: LineEntry[], eol: string): void => {
  if (run.length < MIN_JSDOC_LINES) {
    return;
  }

  const first = mustFind(run[0]);
  const last = mustFind(run[run.length - 1]);

  // A `//` line can hold `*/` as text; merged into a block it would close it early and spill the rest as code.
  if (run
    .some((entry) => {
      return entry.text.includes('*/');
    })) {
    return;
  }

  // A tag inert in `//` lines turns live in a block: `@jsxImportSource` would switch the JSX runtime.
  const tagged = run
    .some((entry) => {
      return JSDOC_TAG.test(entry.text);
    });

  context.report({
    node: first.comment,
    messageId: 'useJsdoc',
    fix: tagged
      ? null
      : (fixer: Fixer) => {
          const texts = run
            .map((entry) => {
              return entry.text;
            });

          return fixer.replaceTextRange([rangeOf(first.comment)[0], rangeOf(last.comment)[1]], jsdocTextFor(
            first.indent,
            texts,
            eol,
          ));
        },
  });
};

const reportShortJsdoc = (
  context: RuleContext,
  sourceCode: SourceCode,
  comment: CommentNode,
  raw: string,
  eol: string,
): void => {
  if (!raw.startsWith('/**')) {
    return;
  }

  const body = jsdocBodyOf(comment);
  const indent = wholeLineIndentOf(sourceCode, comment);

  // An empty body cannot happen in source that parses.
  if (indent === null || body.length === 0 || body.length >= MIN_JSDOC_LINES) {
    return;
  }

  if (body
    .some((line) => {
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
        let run: LineEntry[] = [];

        const flush = (): void => {
          reportRun(context, run, eol);
          run = [];
        };

        for (const comment of sourceCode.getAllComments()) {
          const [start, end] = rangeOf(comment);
          const raw = sourceCode.text.slice(start, end);
          const entry = lineEntryOf(sourceCode, comment, raw);

          // No flush: the next entry is not adjacent and breaks the run itself.
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
