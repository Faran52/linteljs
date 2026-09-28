import { scopeOf, sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  gapIsBlank,
  getIndent,
  getIndentStep,
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

interface Chain {
  top: RuleNode;
  breaks: Break[];
}

interface Gap {
  dot: AST.Token;
  range: AST.Range;
  indent: string;
}

// Keyed by line: each break's new indent, and what each argument line gains ahead of its own indent.
// `undo` takes back a nested chain whose lines do not fit.
interface Plan {
  gaps: Map<number, Gap[]>;
  shifts: Map<number, string>;
  undo: (() => void)[];
}

// Whether a chain went into the plan, and the index past every chain nested in it.
interface Folded {
  fits: boolean;
  after: number;
}

type Edit = [AST.Range, string];

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
    const step = getIndentStep(sourceCode);
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

    const insideTokens = linesInsideTokens(sourceCode);
    const insideComments = linesInsideComments();
    const chains: Chain[] = [];

    const gapsOn = (plan: Plan, line: number): Gap[] => {
      return plan.gaps.get(line) ?? [];
    };

    // Where a token lands once `plan` applies: behind the last break ahead of it on its line, else on its line shifted.
    const indentAt = (plan: Plan, token: AST.Token | RuleNode): string => {
      const { start } = mustFind(token.loc, 'the location of a chained token');
      const [offset] = mustFind(token.range, 'the range of a chained token');
      let indent = `${plan.shifts.get(start.line) ?? ''}${getIndent(sourceCode, token)}`;
      let reached = -1;

      for (const gap of gapsOn(plan, start.line)) {
        if (gap.range[1] <= offset && gap.range[1] > reached) {
          reached = gap.range[1];
          indent = gap.indent;
        }
      }

      return indent;
    };

    // A link at the chain's own indent carries its argument lines a step right, as an indent rule would next.
    const shiftedLines = (plan: Plan, breaks: Break[], outer: string): number[] => {
      const spanned = new Set<number>();

      for (const { dot, link } of breaks) {
        if (indentAt(plan, dot) === outer) {
          const end = mustFind(link.call.loc, 'the location of a chained call').end.line;

          for (let line = dot.loc.start.line + 1; line <= end; line++) {
            spanned.add(line);
          }
        }
      }

      return [...spanned]
        .filter((line) => {
          return !insideTokens.has(line) && lineText(line).trim() !== '';
        });
    };

    const lineFits = (plan: Plan, line: number): boolean => {
      const gaps = [...gapsOn(plan, line)]
        .sort((first, second) => {
          return first.range[0] - second.range[0];
        });

      const splitFit = gaps
        .every((gap, index) => {
          const next = gaps[index + 1]?.range[0] ?? lineEndAfter(text, gap.range[1]);

          return gap.indent.length + text
            .slice(gap.range[1], next)
            .trimEnd().length <= maxLineLength;
        });

      const shift = plan.shifts.get(line) ?? '';
      const kept = lineText(line).slice(0, gaps[0]?.dot.loc.start.column ?? Number.POSITIVE_INFINITY);

      return splitFit && (shift === '' || kept.trimEnd().length + shift.length <= maxLineLength);
    };

    const record = <T>(plan: Plan, map: Map<number, T>, line: number, value: T): void => {
      const previous = map.get(line);

      plan.undo
        .push(() => {
          if (previous === undefined) {
            map.delete(line);
          }
          else {
            map.set(line, previous);
          }
        });

      map.set(line, value);
    };

    const rollBack = (plan: Plan, mark: number): void => {
      while (plan.undo.length > mark) {
        mustFind(plan.undo.pop(), 'an undo step')();
      }
    };

    // Planned against the text `plan` leaves, so a chain in another's arguments settles in the same pass.
    const extend = (plan: Plan, { top, breaks }: Chain): number[] | undefined => {
      const outer = indentAt(plan, top);
      const gaps = breaks
        .map(({ dot }): Gap => {
          return {
            dot,
            range: [mustFind(sourceCode.getTokenBefore(dot), 'the token ahead of a dot').range[1], dot.range[0]],
            indent: `${outer}${step}`,
          };
        });

      const blank = gaps
        .every(({ range }) => {
          return gapIsBlank(sourceCode, range[0], range[1]);
        });

      const shifted = shiftedLines(plan, breaks, outer);

      const crossesComment = shifted
        .some((line) => {
          return insideComments.has(line);
        });

      if (!blank || crossesComment) {
        return undefined;
      }

      for (const gap of gaps) {
        const { line } = gap.dot.loc.start;

        record(plan, plan.gaps, line, [...gapsOn(plan, line), gap]);
      }

      for (const line of shifted) {
        record(plan, plan.shifts, line, `${step}${plan.shifts.get(line) ?? ''}`);
      }

      return gaps
        .map(({ dot }) => {
          return dot.loc.start.line;
        })
        .concat(shifted);
    };

    const chainAt = (index: number): Chain => {
      return mustFind(chains[index], 'a collected chain');
    };

    const startOf = (index: number): number => {
      return mustFind(chainAt(index).top.range, 'the range of a chain')[0];
    };

    /**
     * A chain nested in this one's arguments folds in, or waits for a later pass along with every chain inside it.
     * One in the head is left alone: it ends before this fix begins, so it lands in the same pass already.
     * This chain's own lines are measured last, since a nested chain's breaks can shorten them.
     */
    const fold = (plan: Plan, index: number): Folded => {
      const chain = chainAt(index);
      const [, end] = mustFind(chain.top.range, 'the range of a chain');
      const firstDot = mustFind(chain.breaks[0], 'the first break of a chain').dot.range[0];
      const mark = plan.undo.length;
      const touched = extend(plan, chain);
      let after = index + 1;

      while (after < chains.length && startOf(after) < end) {
        if (touched && startOf(after) >= firstDot) {
          after = fold(plan, after).after;
        }
        else {
          after++;
        }
      }

      const fits = touched
        ?.every((line) => {
          return lineFits(plan, line);
        }) ?? false;

      if (!fits) {
        rollBack(plan, mark);
      }

      return {
        fits,
        after,
      };
    };

    const planAt = (index: number): Plan | undefined => {
      const plan: Plan = {
        gaps: new Map(),
        shifts: new Map(),
        undo: [],
      };

      return fold(plan, index).fits ? plan : undefined;
    };

    const editsOf = (plan: Plan): Edit[] => {
      const edits = [...plan.gaps.values()]
        .flat()
        .map((gap): Edit => {
          return [gap.range, `${eol}${gap.indent}`];
        });

      for (const [line, shift] of plan.shifts) {
        const start = sourceCode.getIndexFromLoc({
          line,
          column: 0,
        });

        edits.push([[start, start], shift]);
      }

      return edits
        .sort((first, second) => {
          return first[0][0] - second[0][0];
        });
    };

    // Collected rather than reported, so the chains nested in each are known when its fix is planned.
    const collect = (top: RuleNode, chain: Part): void => {
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

      if (breaks.length > 0) {
        chains.push({
          top,
          breaks,
        });
      }
    };

    const report = (index: number): void => {
      const { top, breaks } = chainAt(index);

      context.report({
        node: top,
        loc: mustFind(breaks[0], 'the first break of a chain').dot.loc,
        messageId: 'callOnNewline',
        * fix(fixer) {
          const plan = planAt(index);

          if (!plan) {
            return;
          }

          for (const [range, insert] of editsOf(plan)) {
            yield fixer.replaceTextRange(range, insert);
          }
        },
      });
    };

    return {
      'CallExpression': (node) => {
        collect(node, node);
      },
      'MemberExpression': (node) => {
        collect(node, node);
      },
      'ChainExpression': (node) => {
        collect(node, node);
      },
      'Program:exit': () => {
        for (const index of chains.keys()) {
          report(index);
        }
      },
    };
  },
});
