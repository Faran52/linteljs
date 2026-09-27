import {
  type AstNode,
  childrenOf,
  type Program,
} from '../../utils/astUtils.ts';

export interface State {
  ast: Program;
  index: Map<string, AstNode[]>;
  source: string;
  skip: (reason: string) => void;
}

// The edited source, and where the edit landed for the snippet a miss prints.
export interface Candidate {
  source: string;
  offset: number;
}

export type Build = (state: State) => Candidate | undefined;

export const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

// Parent links and a type index in one walk: `parseForESLint` hands back a bare tree and three edits climb.
export const indexAst = (ast: Program): Map<string, AstNode[]> => {
  const byType = new Map<string, AstNode[]>();
  const visit = (node: AstNode, parent: AstNode | undefined): void => {
    node.parent = parent;

    const list = byType.get(node.type);

    if (list) {
      list.push(node);
    }
    else {
      byType.set(node.type, [node]);
    }

    for (const [, child] of childrenOf(node)) {
      visit(child, node);
    }
  };

  visit(ast, undefined);

  return byType;
};

export const nodesOf = (state: State, type: string): AstNode[] => {
  return state.index.get(type) ?? [];
};

export const textOf = (state: State, node: AstNode): string => {
  return state.source.slice(node.range[0], node.range[1]);
};

export const commentsIn = (state: State, from: number, to: number): boolean => {
  return state.ast.comments.some((comment) => {
    return comment.range[1] > from && comment.range[0] < to;
  });
};

// A comment, a template literal and a string continuation all make a reflow unsafe or a case the rule declines.
export const unsafeToReflow = (state: State, from: number, to: number): string | undefined => {
  if (commentsIn(state, from, to)) {
    return 'comment inside the range the edit rewrites';
  }

  const slice = state.source.slice(from, to);

  if (slice.includes('`')) {
    return 'template literal in range, whose newlines are program text';
  }

  return /\\\r?\n/.test(slice) ? 'string line continuation in range' : undefined;
};

// Split and trim rather than `/[ \t]*\r?\n[ \t]*/g`, which is super-linear on a long run of indentation.
const collapse = (text: string): string => {
  return text.split(/\r?\n/).map((line) => {
    return line.trim();
  }).join(' ');
};

export const replaced = (state: State, from: number, to: number, text: string): Candidate => {
  return {
    source: state.source.slice(0, from) + text + state.source.slice(to),
    offset: from,
  };
};

// One span reflowed onto a single line, or the reason not to.
export const joinRange = (state: State, from: number, to: number): Candidate | undefined => {
  const unsafe = unsafeToReflow(state, from, to);

  if (unsafe !== undefined) {
    state.skip(unsafe);

    return undefined;
  }

  return replaced(state, from, to, collapse(state.source.slice(from, to)));
};

export const spansLines = (first: AstNode, last: AstNode): boolean => {
  return first.loc.start.line !== last.loc.end.line;
};

// Every member on a line of its own, which is what these rules call correct.
export const fullySplit = (members: AstNode[]): boolean => {
  return members.every((member, index) => {
    const previous = members[index - 1];

    return previous === undefined || spansLines(previous, member);
  });
};

export const climb = (node: AstNode, matches: (ancestor: AstNode) => boolean): AstNode | undefined => {
  for (let current = node.parent; current; current = current.parent) {
    if (matches(current)) {
      return current;
    }
  }

  return undefined;
};

export const pickFirst = <T>(nodes: AstNode[], build: (node: AstNode) => T | undefined): T | undefined => {
  for (const node of nodes) {
    const built = build(node);

    if (built !== undefined) {
      return built;
    }
  }

  return undefined;
};

// A blank line opened after the comma between two members. Found in the text, since this harness holds no tokens.
export const insertBlankLine = (state: State, previous: AstNode, next: AstNode): Candidate | undefined => {
  if (!spansLines(previous, next)) {
    return undefined;
  }

  if (commentsIn(state, previous.range[1], next.range[0])) {
    state.skip('comment in the gap the blank line would open');

    return undefined;
  }

  const comma = state.source.indexOf(',', previous.range[1]);

  return comma === -1 || comma > next.range[0] ? undefined : replaced(state, comma + 1, comma + 1, '\n');
};

// One member per line. Braces come from the member ranges, so an import attribute's `{` cannot be taken for them.
export const splitBraces = (state: State, members: AstNode[]): Candidate | undefined => {
  const [first] = members;
  const last = members.at(-1);

  if (first === undefined || last === undefined) {
    return undefined;
  }

  const open = state.source.lastIndexOf('{', first.range[0]);
  const close = state.source.indexOf('}', last.range[1]);

  if (open === -1 || close === -1) {
    return undefined;
  }

  const unsafe = unsafeToReflow(state, open, close + 1);

  if (unsafe !== undefined) {
    state.skip(unsafe);

    return undefined;
  }

  const text = members.map((member) => {
    return textOf(state, member);
  }).join(',\n  ');

  return replaced(state, open, close + 1, `{\n  ${text}\n}`);
};

// Members held apart by newlines alone would join into `{ a: string b: number }`, a broken edit rather than a case.
export const separatedByPunctuation = (state: State, members: AstNode[]): boolean => {
  return members.every((member, index) => {
    const next = members[index + 1];

    if (next === undefined) {
      return true;
    }

    const gap = state.source.slice(member.range[1], next.range[0]).trim();

    return /[;,]$/.test(textOf(state, member)) || gap.startsWith(';') || gap.startsWith(',');
  });
};

export const escapeName = (name: string): string => {
  return name.replaceAll('$', String.raw`\$`);
};
