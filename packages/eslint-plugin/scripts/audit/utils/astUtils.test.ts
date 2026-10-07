import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  childrenOf,
  isTypeScript,
  listOf,
  nameFor,
  nodeOf,
  parse,
  parseOrNull,
  walkAst,
} from './astUtils.ts';

const mockParser = (parser: object): void => {
  vi.doMock('typescript-eslint', () => {
    const module = { default: { parser } };

    return module;
  });
};

afterEach(() => {
  vi.doUnmock('typescript-eslint');
  vi.resetModules();
});

describe('isTypeScript', () => {
  it.each([
    ['file.ts', true],
    ['file.tsx', true],
    ['file.js', false],
    ['file.cjs', false],
    ['a.ts', false],
  ])('%s is %s', (name, expected) => {
    const answer = isTypeScript(name);

    expect(answer).toBe(expected);
  });
});

describe('parse', () => {
  it.each([
    ['file.ts', 'const a: number = 1; // n\n'],
    ['file.tsx', 'const a = <div />; // n\n'],
    ['file.js', 'import a from "a"; const b = <a />; // n\n'],
    ['file.cjs', 'return; // n\n'],
  ])('answers the Program of %s with its tokens and comments', (name, source) => {
    const program = parse(source, name);

    const shape = [
      program.type,
      program.tokens.length > 0,
      program.comments.length,
    ];

    expect(shape).toEqual([
      'Program',
      true,
      1,
    ]);
  });

  it('reads a .js as a module', () => {
    const parsing = (): void => {
      parse('return;\n', 'file.js');
    };

    expect(parsing).toThrow();
  });

  it('fails on a parser answer that is not a Program', async () => {
    mockParser({
      parseForESLint: () => {
        const answer = { ast: {
          type: 'Program',
          range: [0, 0],
          body: [],
        } };

        return answer;
      },
    });

    const fresh = await import('./astUtils.ts');

    const parsing = (): void => {
      fresh.parse('', 'file.ts');
    };

    expect(parsing).toThrow('file.ts parsed to something that is not a Program');
  });

  it.each([
    ['not an object', null],
    ['without a body', { type: 'Program', range: [0, 0] }],
    ['without comments', {
      type: 'Program',
      range: [0, 0],
      body: [],
      tokens: [],
    }],
    ['without a range', {
      type: 'Program',
      body: [],
      tokens: [],
      comments: [],
    }],
  ])('rejects an answer %s', async (_label, ast) => {
    mockParser({
      parseForESLint: () => {
        const answer = { ast };

        return answer;
      },
    });

    const fresh = await import('./astUtils.ts');

    const program = fresh.parseOrNull('', 'file.ts');

    expect(program).toBeNull();
  });

  it('fails to load when typescript-eslint no longer exposes parseForESLint', async () => {
    mockParser({});

    const loading = import('./astUtils.ts');

    await expect(loading).rejects.toThrow('espree or typescript-eslint no longer exposes the parse function');
  });
});

describe('parseOrNull', () => {
  it('answers null for source that will not parse', () => {
    const program = parseOrNull('const = ;', 'file.js');

    expect(program).toBeNull();
  });

  it('answers the Program of source that parses', () => {
    const program = parseOrNull('a;', 'file.js');

    expect(program?.type).toBe('Program');
  });
});

describe('nameFor', () => {
  it.each([
    [
      'a.ts',
      '',
      'file.ts',
    ],
    [
      'a.tsx',
      '',
      'file.tsx',
    ],
    [
      'a.cjs',
      '',
      'file.cjs',
    ],
    [
      'a.mjs',
      '',
      'file.js',
    ],
    [
      'a.js',
      'export const a = 1;',
      'file.js',
    ],
    [
      'a.js',
      'return;',
      'file.cjs',
    ],
    [
      'a.jsx',
      'export const a = <a />;',
      'file.js',
    ],
  ])('names %s holding %j as %s', (file, source, expected) => {
    const name = nameFor(file, source);

    expect(name).toBe(expected);
  });
});

describe('childrenOf', () => {
  it('answers each child node with its key, lists spread and plain values skipped', () => {
    const program = parse('f(a, 1); b;', 'file.js');

    const children = childrenOf(program);

    const named = children
      .map(([key, child]) => {
        const pair = [key, child.type];

        return pair;
      });
    expect(named).toEqual([['body', 'ExpressionStatement'], ['body', 'ExpressionStatement']]);
  });

  it('skips the tokens, comments, location and parent', () => {
    const program = parse('/* c */ a;', 'file.js');
    const node = {
      ...program,
      body: [],
      parent: program,
    };

    const children = childrenOf(node);

    expect(children).toEqual([]);
  });
});

describe('walkAst', () => {
  it('visits each node with its parent and key, in source order', () => {
    const program = parse('a; b;', 'file.js');
    const visits: [string, string | undefined, string | undefined][] = [];

    walkAst(program, (node, parent, key) => {
      visits.push([
        node.type,
        parent?.type,
        key,
      ]);

      return true;
    });

    expect(visits).toEqual([
      [
        'Program',
        undefined,
        undefined,
      ],
      [
        'ExpressionStatement',
        'Program',
        'body',
      ],
      [
        'Identifier',
        'ExpressionStatement',
        'expression',
      ],
      [
        'ExpressionStatement',
        'Program',
        'body',
      ],
      [
        'Identifier',
        'ExpressionStatement',
        'expression',
      ],
    ]);
  });

  it('does not descend below a node the visitor declines', () => {
    const program = parse('a; b;', 'file.js');
    const visited: string[] = [];

    walkAst(program, (node) => {
      visited.push(node.type);

      return node.type !== 'ExpressionStatement';
    });

    expect(visited).toEqual([
      'Program',
      'ExpressionStatement',
      'ExpressionStatement',
    ]);
  });
});

describe('nodeOf', () => {
  it('answers a node', () => {
    const program = parse('a;', 'file.js');

    const node = nodeOf(program);

    expect(node).toBe(program);
  });

  it.each([
    ['null', null],
    ['a string', 'a'],
    ['a number', 1],
    ['a list', []],
  ])('answers undefined for %s', (_label, value) => {
    const node = nodeOf(value);

    expect(node).toBeUndefined();
  });
});

describe('listOf', () => {
  it('answers a list as it is', () => {
    const program = parse('a;', 'file.js');

    const list = listOf(program.body);

    expect(list).toBe(program.body);
  });

  it('answers an empty list for a node', () => {
    const program = parse('a;', 'file.js');

    const list = listOf(program);

    expect(list).toEqual([]);
  });

  it('answers an empty list for nothing', () => {
    const list = listOf(undefined);

    expect(list).toEqual([]);
  });
});
