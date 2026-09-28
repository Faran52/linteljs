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

// `last` is the index of the last chain collected inside this one, itself when none is.
interface Chain {
  top: RuleNode;
  breaks: Break[];
  last: number;
}

interface Gap {
  dot: AST.Token;
  range: AST.Range;
  indent: string;
}

// Keyed by line. A shift is indent added ahead of the line's own.
interface Plan {
  gaps: Map<number, Gap[]>;
  shifts: Map<number, string>;
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
        start: links.length > 0 ? mustFind(runStart) : callee,
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
  return mustFind(sourceCode.getTokenBefore(member.property));
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
        .join();
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
        const { start, end } = mustFind(comment.loc);

        for (let line = start.line + 1; line <= end.line; line++) {
          inside.add(line);
        }
      }

      return inside;
    };

    const insideTokens = linesInsideTokens(sourceCode);
    const insideComments = linesInsideComments();
    const chains: Chain[] = [];
    const byTop = new Map<RuleNode, Chain>();

    const gapsOn = (plan: Plan, line: number): Gap[] => {
      return plan.gaps.get(line) ?? [];
    };

    const breakAt = (plan: Plan, token: AST.Token): Gap | undefined => {
      return gapsOn(plan, token.loc.start.line)
        .find((gap) => {
          return gap.dot === token;
        });
    };

    // The nearest break at or before the token on its line decides the indent it lands on.
    const indentAt = (plan: Plan, token: AST.Token | RuleNode): string => {
      const { line } = mustFind(token.loc).start;

      for (
        let current = sourceCode.getTokenByRangeStart(mustFind(token.range)[0]);
        current !== null && current.loc.start.line === line;
        current = sourceCode.getTokenBefore(current)
      ) {
        const gap = breakAt(plan, current);

        if (gap) {
          return gap.indent;
        }
      }

      return `${plan.shifts.get(line) ?? ''}${getIndent(sourceCode, token)}`;
    };

    // A link at the chain's own indent carries its argument lines a step right, as an indent rule would next.
    const shiftedLines = (plan: Plan, breaks: Break[], outer: string): number[] => {
      const spanned = new Set<number>();

      for (const { dot, link } of breaks) {
        if (indentAt(plan, dot) === outer) {
          const end = mustFind(link.call.loc).end.line;

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

    // Planned against the text `plan` leaves, so a chain in another's arguments settles in the same pass.
    const extend = (plan: Plan, { top, breaks }: Chain): number[] | undefined => {
      const outer = indentAt(plan, top);
      const gaps = breaks
        .map(({ dot }): Gap => {
          return {
            dot,
            range: [mustFind(sourceCode.getTokenBefore(dot)).range[1], dot.range[0]],
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

        plan.gaps.set(line, [...gapsOn(plan, line), gap]);
      }

      for (const line of shifted) {
        plan.shifts.set(line, `${step}${plan.shifts.get(line) ?? ''}`);
      }

      return gaps
        .map(({ dot }) => {
          return dot.loc.start.line;
        })
        .concat(shifted);
    };

    const chainAt = (index: number): Chain => {
      return mustFind(chains[index]);
    };

    const within = (node: RuleNode, container: object): boolean => {
      for (let current: RuleNode | null = node; current !== null; current = current.parent) {
        if (current === container) {
          return true;
        }
      }

      return false;
    };

    // A later chain on a line this plan breaks moves with the break.
    const onBrokenLine = (plan: Plan, index: number): boolean => {
      return gapsOn(plan, mustFind(chainAt(index).top.loc).start.line).length > 0;
    };

    // A chain in the head ends before this fix begins, so it lands in the same pass unfolded.
    // Own lines are measured last: a nested chain's breaks can shorten them.
    const fold = (plan: Plan, index: number): number => {
      const chain = chainAt(index);
      const head = mustFind(chain.breaks[0]).link.start.object;
      const saved = {
        gaps: new Map(plan.gaps),
        shifts: new Map(plan.shifts),
      };
      const touched = extend(plan, chain);
      let after = index + 1;

      while (after <= chain.last) {
        if (touched && !within(chainAt(after).top, head)) {
          after = fold(plan, after);
        }
        else {
          after++;
        }
      }

      const fits = touched
        ?.every((line) => {
          return lineFits(plan, line);
        });

      if (fits !== true) {
        plan.gaps = saved.gaps;
        plan.shifts = saved.shifts;

        return after;
      }

      while (after < chains.length && onBrokenLine(plan, after)) {
        after = fold(plan, after);
      }

      return after;
    };

    const planAt = (index: number): Plan => {
      const plan: Plan = {
        gaps: new Map(),
        shifts: new Map(),
      };

      fold(plan, index);

      return plan;
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

      return edits;
    };

    // Collected rather than reported, so the chains nested in each are known when its fix is planned.
    const collect = (top: RuleNode, chain: Part): void => {
      if (continues(mustFind(top.parent), chain)) {
        return;
      }

      const links = chainLinksOf(top, chain);

      if (links.length === 1 && !takesBlockCallback(mustFind(links[0]))) {
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
        const collected: Chain = {
          top,
          breaks,
          last: chains.length,
        };

        chains.push(collected);
        byTop.set(top, collected);
      }
    };

    const close = (node: RuleNode): void => {
      const closed = byTop.get(node);

      if (closed) {
        closed.last = chains.length - 1;
      }
    };

    const report = (index: number): void => {
      const { top, breaks } = chainAt(index);

      context.report({
        node: top,
        loc: mustFind(breaks[0]).dot.loc,
        messageId: 'callOnNewline',
        * fix(fixer) {
          for (const [range, insert] of editsOf(planAt(index))) {
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
      'CallExpression:exit': close,
      'MemberExpression:exit': close,
      'ChainExpression:exit': close,
      'Program:exit': () => {
        for (const index of chains.keys()) {
          report(index);
        }
      },
    };
  },
});
