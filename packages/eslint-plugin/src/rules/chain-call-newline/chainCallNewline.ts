import { scopeOf, sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  gapIsBlank,
  getIndent,
  indentReader,
  linesInsideTokens,
  lineTerminatorOf,
  sameLine,
} from '../../utils/layoutUtils.ts';
import {
  createRule,
  type MemberExpressionNode,
  mustFind,
  optionsOf,
  resolveVariable,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import type { AST } from 'eslint';

interface ChainCallNewlineOptions {
  maxLineLength: number;
}

interface MemberMatch {
  type: 'MemberExpression';
}

interface CallMatch {
  type: 'CallExpression';
}

// Read off the member type so no ESTree import is needed.
type Part = MemberExpressionNode['object'];

type Member = Extract<Part, MemberMatch>;

type Call = Extract<Part, CallMatch>;

type Step = Call | Member;

interface Link {
  call: Call;
  start: Member;
  leading: boolean;
}

interface Break {
  dot: AST.Token;
  link: Link;
}

interface Plan {
  gaps: AST.Range[];
  shifted: number[];
}

// The same figure `member-newline` and `import-newlines` default to.
const DEFAULT_MAX_LINE_LENGTH = 120;

// `ROUTES.map(...)` is a method on a value, `Object.keys(...)` and `z.string()` are calls into a namespace.
const CONSTANT_NAME = /^[A-Z][\dA-Z_]*$/;

const continues = (parent: RuleNode, child: Part): boolean => {
  if (parent.type === 'MemberExpression') {
    return parent.object === child;
  }

  if (parent.type === 'CallExpression') {
    return parent.callee === child;
  }

  return parent.type === 'ChainExpression';
};

const unwind = (node: Part, steps: Step[]): Part => {
  if (node.type === 'ChainExpression') {
    return unwind(node.expression, steps);
  }

  if (node.type === 'CallExpression') {
    steps.unshift(node);

    return unwind(node.callee, steps);
  }

  if (node.type === 'MemberExpression') {
    steps.unshift(node);

    return unwind(node.object, steps);
  }

  return node;
};

// Property reads after a link open the next one, so `rows.find(fn).name.trim()` breaks ahead of `.name`.
const linksOf = (steps: Step[]): Link[] => {
  const links: Link[] = [];
  let runStart: Member | undefined;
  let calledBefore = false;

  for (const step of steps) {
    if (step.type === 'MemberExpression') {
      runStart = step.computed ? undefined : runStart ?? step;
      continue;
    }

    const { callee } = step;

    if (callee.type === 'MemberExpression' && !callee.computed) {
      links.push({
        call: step,
        start: links.length > 0 ? mustFind(runStart, 'the property read a chained call starts at') : callee,
        leading: !calledBefore,
      });
    }

    runStart = undefined;
    calledBefore = true;
  }

  return links;
};

const takesBlockCallback = (link: Link): boolean => {
  return link.call.arguments
    .some((argument) => {
      return (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        && argument.body.type === 'BlockStatement';
    });
};

// A non-computed member is always `object . property`.
const dotOf = (sourceCode: SourceCode, member: Member): AST.Token => {
  return mustFind(sourceCode.getTokenBefore(member.property), 'the dot of a chained call');
};

const lineEndAfter = (text: string, from: number): number => {
  const newline = text.indexOf('\n', from);

  return newline === -1 ? text.length : newline;
};

export const chainCallNewline = createRule('chain-call-newline', {
  meta: {
    type: 'layout',
    docs: {
      language: 'universal',
      recommended: true,
      fixShape: 'whitespace',
      description: 'Put each call on its own line once a chain has two calls or a callback with a body.',
    },
    fixable: 'whitespace',
    messages: {
      callOnNewline: 'Put each call in this chain on its own line.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxLineLength: {
            type: 'integer',
            minimum: 1,
            default: DEFAULT_MAX_LINE_LENGTH,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const options = optionsOf<ChainCallNewlineOptions>(context);
    const maxLineLength = options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
    const indentsAt = indentReader(sourceCode);
    const eol = lineTerminatorOf(sourceCode);
    const { text } = sourceCode;

    // Read without the undefined arm an index would carry.
    const lineText = (line: number): string => {
      return sourceCode.lines
        .slice(line - 1, line)
        .join('');
    };

    const isNamespace = (top: RuleNode, base: Part): boolean => {
      if (base.type !== 'Identifier') {
        return false;
      }

      const variable = resolveVariable(scopeOf(context, top), base.name);

      if (!variable || variable.defs.length === 0) {
        return true;
      }

      return !CONSTANT_NAME.test(base.name) && variable.defs
        .every((definition) => {
          return definition.type === 'ImportBinding';
        });
    };

    // The head keeps a namespace call: `Object.keys(x).map(fn)` is one call on the head `Object.keys(x)`.
    const chainLinksOf = (top: RuleNode, node: Part): Link[] => {
      const steps: Step[] = [];
      const base = unwind(node, steps);
      const links = linksOf(steps);

      return links[0]?.leading === true && isNamespace(top, base) ? links.slice(1) : links;
    };

    // Shifting a line a block comment continues onto would rewrite the comment's text.
    const linesInsideComments = (): Set<number> => {
      const inside = new Set<number>();

      for (const comment of sourceCode.getAllComments()) {
        const { start, end } = mustFind(comment.loc, 'the location of a comment');

        for (let line = start.line + 1; line <= end.line; line++) {
          inside.add(line);
        }
      }

      return inside;
    };

    // A link at the chain's own indent carries its argument lines a step right, as an indent rule would next.
    const shiftedLines = (breaks: Break[], outer: string): number[] => {
      const spanned = new Set<number>();

      for (const { dot, link } of breaks) {
        if (getIndent(sourceCode, dot) === outer) {
          const end = mustFind(link.call.loc, 'the location of a chained call').end.line;

          for (let line = dot.loc.start.line + 1; line <= end; line++) {
            spanned.add(line);
          }
        }
      }

      const insideTokens = linesInsideTokens(sourceCode);

      return [...spanned]
        .filter((line) => {
          return !insideTokens.has(line) && lineText(line).trim() !== '';
        });
    };

    const planFix = (breaks: Break[], outer: string, inner: string): Plan | undefined => {
      const gaps = breaks
        .map(({ dot }): AST.Range => {
          return [mustFind(sourceCode.getTokenBefore(dot), 'the token ahead of a dot').range[1], dot.range[0]];
        });

      const blank = gaps
        .every(([from, to]) => {
          return gapIsBlank(sourceCode, from, to);
        });

      const shifted = shiftedLines(breaks, outer);
      const insideComments = linesInsideComments();

      const crossesComment = shifted
        .some((line) => {
          return insideComments.has(line);
        });

      if (!blank || crossesComment) {
        return undefined;
      }

      const starts = breaks
        .map(({ dot }) => {
          return dot.range[0];
        });

      const newLinesFit = starts
        .every((start, index) => {
          const next = starts[index + 1] ?? Number.POSITIVE_INFINITY;
          const segment = text.slice(start, Math.min(next, lineEndAfter(text, start)));

          return inner.length + segment.trimEnd().length <= maxLineLength;
        });

      const cutAt = new Map<number, number>();

      for (const { dot } of [...breaks].reverse()) {
        cutAt.set(dot.loc.start.line, dot.loc.start.column);
      }

      const step = inner.length - outer.length;
      const shiftedFit = shifted
        .every((line) => {
          const kept = lineText(line).slice(0, cutAt.get(line) ?? Number.POSITIVE_INFINITY);

          return kept.trimEnd().length + step <= maxLineLength;
        });

      return newLinesFit && shiftedFit
        ? {
            gaps,
            shifted,
          }
        : undefined;
    };

    // Acted on at the outermost level only, so each chain is read once.
    const check = (top: RuleNode, chain: Part): void => {
      if (continues(mustFind(top.parent, 'the parent of an expression'), chain)) {
        return;
      }

      const links = chainLinksOf(top, chain);

      if (links.length < 2 && !links.some(takesBlockCallback)) {
        return;
      }

      const breaks = links
        .map((link): Break => {
          return {
            dot: dotOf(sourceCode, link.start),
            link,
          };
        })
        .filter(({ dot }) => {
          return sameLine(sourceCode.getTokenBefore(dot), dot);
        });

      const first = breaks[0];

      if (!first) {
        return;
      }

      const { outer, inner } = indentsAt(top);

      context.report({
        node: top,
        loc: first.dot.loc,
        messageId: 'callOnNewline',
        * fix(fixer) {
          const plan = planFix(breaks, outer, inner);

          if (!plan) {
            return;
          }

          for (const gap of plan.gaps) {
            yield fixer.replaceTextRange(gap, `${eol}${inner}`);
          }

          for (const line of plan.shifted) {
            const start = sourceCode.getIndexFromLoc({
              line,
              column: 0,
            });

            yield fixer.insertTextBeforeRange([start, start], inner.slice(outer.length));
          }
        },
      });
    };

    return {
      CallExpression: (node) => {
        check(node, node);
      },
      MemberExpression: (node) => {
        check(node, node);
      },
      ChainExpression: (node) => {
        check(node, node);
      },
    };
  },
});
