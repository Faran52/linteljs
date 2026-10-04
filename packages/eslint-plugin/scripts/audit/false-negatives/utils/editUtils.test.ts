import { runBuild } from '@mocks/runBuild.ts';

import { type AstNode, parse } from '../../utils/astUtils.ts';

import {
  climb,
  commentsIn,
  escapeName,
  fullySplit,
  FUNCTION_TYPES,
  indexAst,
  insertBlankLine,
  joinRange,
  nodesOf,
  pickFirst,
  replaced,
  separatedByPunctuation,
  spansLines,
  type State,
  textOf,
  unsafeToReflow,
} from './editUtils.ts';

const stateOf = (source: string): State => {
  const ast = parse(source, 'file.ts');
  const state = {
    ast,
    index: indexAst(ast),
    source,
    skip: vi.fn<(reason: string) => void>(),
  };

  return state;
};

// Every fixture's array holds number literals only, so its literals are its elements, in order.
const elementsOf = (state: State): AstNode[] => {
  return nodesOf(state, 'Literal');
};

describe('FUNCTION_TYPES', () => {
  it('names the three function node types', () => {
    const types = [...FUNCTION_TYPES];

    expect(types).toStrictEqual([
      'ArrowFunctionExpression',
      'FunctionDeclaration',
      'FunctionExpression',
    ]);
  });
});

describe('indexAst', () => {
  it('groups every node by type and links each to its parent', () => {
    const state = stateOf('const a = 1;\nconst b = 2;\n');
    const declarations = nodesOf(state, 'VariableDeclaration');
    const [first] = nodesOf(state, 'Identifier');

    expect(declarations).toHaveLength(2);
    expect(first?.parent?.type).toBe('VariableDeclarator');
    expect(state.ast.parent).toBeUndefined();
  });
});

describe('nodesOf', () => {
  it('returns an empty list for a type the tree lacks', () => {
    const state = stateOf('const a = 1;\n');
    const nodes = nodesOf(state, 'ClassDeclaration');

    expect(nodes).toStrictEqual([]);
  });
});

describe('textOf', () => {
  it('slices the source a node spans', () => {
    const state = stateOf('const a = [1, 2];\n');
    const [array] = nodesOf(state, 'ArrayExpression');
    const text = array ? textOf(state, array) : undefined;

    expect(text).toBe('[1, 2]');
  });
});

describe('commentsIn', () => {
  const COMMENTED = 'const a = 1; // note\nconst b = 2;\n';

  it('finds a comment overlapping the range', () => {
    const state = stateOf(COMMENTED);
    const start = COMMENTED.indexOf('//');
    const inside = commentsIn(state, start + 1, start + 2);

    expect(inside).toBe(true);
  });

  it('misses a comment that ends at the start or starts at the end of the range', () => {
    const state = stateOf(COMMENTED);
    const before = commentsIn(state, COMMENTED.indexOf('\n'), COMMENTED.length);
    const after = commentsIn(state, 0, COMMENTED.indexOf('//'));

    expect(before).toBe(false);
    expect(after).toBe(false);
  });
});

describe('unsafeToReflow', () => {
  it.each([
    ['const a = [1, // n\n  2];\n', 'comment inside the range the edit rewrites'],
    ['const a = [`x`,\n  2];\n', 'template literal in range, whose newlines are program text'],
    ["const a = ['x\\\n', 2];\n", 'string line continuation in range'],
    ["const a = ['x\\\r\n', 2];\n", 'string line continuation in range'],
    ['const a = [1,\n  2];\n', undefined],
  ])('reads %j as %j', (source, expected) => {
    const state = stateOf(source);
    const reason = unsafeToReflow(state, 0, source.length);

    expect(reason).toBe(expected);
  });
});

describe('replaced', () => {
  it('splices the text over the range and records where', () => {
    const state = stateOf('const a = 1;\n');
    const candidate = replaced(state, 10, 11, '22');

    expect(candidate).toStrictEqual({
      source: 'const a = 22;\n',
      offset: 10,
    });
  });
});

describe('joinRange', () => {
  it('collapses the range onto one line, trimming each line', () => {
    const { offset, output } = runBuild((state) => {
      return joinRange(state, 10, state.source.length - 2);
    }, 'const a = [\n  1,\r\n  2,\n];\n');

    expect(output).toBe('const a = [ 1, 2, ];\n');
    expect(offset).toBe(10);
  });

  it('skips a range unsafe to reflow', () => {
    const { output, skips } = runBuild((state) => {
      return joinRange(state, 0, state.source.length);
    }, 'const a = [`x`,\n  2];\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['template literal in range, whose newlines are program text']);
  });
});

describe('spansLines and fullySplit', () => {
  it('tells members on their own lines from members sharing one', () => {
    const split = stateOf('const a = [\n  1,\n  2,\n  3,\n];\n');
    const partly = stateOf('const a = [\n  1, 2,\n  3,\n];\n');
    const [first, second] = elementsOf(partly);
    const whole = fullySplit(elementsOf(split));
    const part = fullySplit(elementsOf(partly));
    const apart = first && second ? spansLines(first, second) : undefined;

    expect(whole).toBe(true);
    expect(part).toBe(false);
    expect(apart).toBe(false);
  });

  it('holds for no members', () => {
    const split = fullySplit([]);

    expect(split).toBe(true);
  });
});

describe('climb', () => {
  const literalOf = (): AstNode => {
    const [literal] = nodesOf(stateOf('function run() {\n  return 1;\n}\n'), 'Literal');

    if (!literal) {
      throw new Error('fixture holds a literal');
    }

    return literal;
  };

  it('finds the nearest matching ancestor', () => {
    const found = climb(literalOf(), (ancestor) => {
      return FUNCTION_TYPES.has(ancestor.type);
    });

    expect(found?.type).toBe('FunctionDeclaration');
  });

  it('returns undefined past the root', () => {
    const found = climb(literalOf(), () => {
      return false;
    });

    expect(found).toBeUndefined();
  });
});

describe('pickFirst', () => {
  const LIST = 'const a = [1, 2, 3];\n';

  it('returns the first node the build accepts', () => {
    const state = stateOf(LIST);
    const picked = pickFirst(elementsOf(state), (node) => {
      return node.range[0] > 11 ? textOf(state, node) : undefined;
    });

    expect(picked).toBe('2');
  });

  it('returns undefined when the build accepts none', () => {
    const state = stateOf(LIST);
    const picked = pickFirst(elementsOf(state), (node) => {
      return node.range[0] < 0 ? textOf(state, node) : undefined;
    });

    expect(picked).toBeUndefined();
  });
});

describe('insertBlankLine', () => {
  const build = (state: State): ReturnType<typeof insertBlankLine> => {
    const [previous, next] = elementsOf(state);

    return previous && next ? insertBlankLine(state, previous, next) : undefined;
  };

  it('opens a blank line after the comma between two members', () => {
    const { offset, output } = runBuild(build, 'const a = [\n  1,\n  2,\n];\n');

    expect(output).toBe('const a = [\n  1,\n\n  2,\n];\n');
    expect(offset).toBe(16);
  });

  it('leaves members sharing a line', () => {
    const { output } = runBuild(build, 'const a = [1, 2];\n');

    expect(output).toBeUndefined();
  });

  it('skips a gap holding a comment', () => {
    const { output, skips } = runBuild(build, 'const a = [\n  1, // n\n  2,\n];\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['comment in the gap the blank line would open']);
  });

  it.each([
    'const a = 1\nconst b = 2;\n',
    'const a = 1\nconst b = 2, c = 3;\n',
  ])('needs a comma in the gap of %j', (source) => {
    const { output } = runBuild(build, source);

    expect(output).toBeUndefined();
  });
});

describe('separatedByPunctuation', () => {
  it.each([
    ['interface A {\n  a: string;\n  b: number;\n}\n', true],
    ['interface A {\n  a: string,\n  b: number\n}\n', true],
    ['interface A {\n  a: string\n  b: number\n}\n', false],
  ])('reads %j as %j', (source, expected) => {
    const state = stateOf(source);
    const separated = separatedByPunctuation(state, nodesOf(state, 'TSPropertySignature'));

    expect(separated).toBe(expected);
  });

  it.each([
    ['const a = [1 , 2];\n', 'Literal'],
    ['a ; b;\n', 'Identifier'],
  ])('accepts a gap in %j that opens with a separator', (source, type) => {
    const state = stateOf(source);
    const separated = separatedByPunctuation(state, nodesOf(state, type));

    expect(separated).toBe(true);
  });
});

describe('escapeName', () => {
  it('escapes every dollar sign', () => {
    const escaped = escapeName('$a$b');

    expect(escaped).toBe(String.raw`\$a\$b`);
  });
});
