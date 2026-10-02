import { captureFixer } from '@mocks/captureFixer';
import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { importNewlines } from '../rules/import-newlines/importNewlines.ts';

import {
  adjacentPairs,
  breakGaps,
  gapIsBlank,
  gapsToBreak,
  getIndent,
  getIndentStep,
  indentReader,
  isBlank,
  linesInsideTokens,
  lineSpan,
  lineTerminatorOf,
  type ListGap,
  listGaps,
  sameLine,
} from './layoutUtils.ts';
import {
  mustFind,
  rangeOf,
  type RuleNode,
  type SourceCode,
} from './ruleUtils.ts';

const stepFor = (code: string): string => {
  return getIndentStep(sourceCodeFrom(code).sourceCode);
};

describe('adjacentPairs', () => {
  it('pairs each item with the one before it', () => {
    const actual = [...adjacentPairs([
      'a',
      'b',
      'c',
    ])];
    const expected = [['a', 'b'], ['b', 'c']];
    expect(actual).toEqual(expected);
  });

  it('yields nothing for a list too short to hold a pair', () => {
    const actual = [...adjacentPairs(['only'])];
    expect(actual).toEqual([]);
    const actual2 = [...adjacentPairs([])];
    expect(actual2).toEqual([]);
  });

  it('carries a null member through as a side of a pair', () => {
    const actual = [...adjacentPairs([
      null,
      null,
      'third',
    ])];
    const expected = [[null, null], [null, 'third']];

    expect(actual)
      .toEqual(expected);
  });
});

describe('lineSpan', () => {
  it('lists both ends', () => {
    const actual = lineSpan(3, 5);
    const expected = [
      3,
      4,
      5,
    ];
    expect(actual).toEqual(expected);

    const actual2 = lineSpan(4, 4);
    const expected2 = [4];
    expect(actual2).toEqual(expected2);
  });

  it('is empty when last falls before first', () => {
    const actual = lineSpan(5, 4);
    expect(actual).toEqual([]);
    const actual2 = lineSpan(5, 2);
    expect(actual2).toEqual([]);
  });
});

describe('linesInsideTokens', () => {
  it('holds the continuation lines of a multi-line token only', () => {
    const { sourceCode } = sourceCodeFrom('const a = `x\ny\nz`;\nconst b = 1;');

    const actual = [...linesInsideTokens(sourceCode)];
    const expected = [2, 3];
    expect(actual).toEqual(expected);
  });
});

describe('getIndentStep', () => {
  it.each([
    [
      'reads two spaces from a two-space file',
      'function load() {\n  return 1;\n}\n',
      '  ',
    ],
    [
      'reads four spaces from a four-space file',
      'function load() {\n    return 1;\n}\n',
      '    ',
    ],
    [
      'takes the narrowest indent, not the deepest',
      'function load() {\n  if (ready) {\n    return 1;\n  }\n}\n',
      '  ',
    ],
    [
      'reads a tab from a tab-indented file',
      'function load() {\n\treturn 1;\n}\n',
      '\t',
    ],
    [
      'prefers spaces when they outnumber tabs',
      'function a() {\n  return 1;\n}\nfunction b() {\n  return 2;\n}\nfunction c() {\n\treturn 3;\n}\n',
      '  ',
    ],
    [
      'prefers tabs when they are at least as common',
      'function a() {\n\treturn 1;\n}\nfunction b() {\n  return 2;\n}\n',
      '\t',
    ],
    [
      'falls back to two spaces when nothing is indented',
      'const value = 1;\nconst other = 2;\n',
      '  ',
    ],
    [
      'ignores block comment continuation lines',
      '/**\n * A doc block.\n */\nfunction load() {\n    return 1;\n}\n',
      '    ',
    ],
    [
      'falls back to two spaces when the narrowest indent is a single space',
      'const value = [\n mis,\n aligned,\n];\n',
      '  ',
    ],
    [
      'falls back to two spaces when the narrowest indent is implausibly wide',
      'const value = [\n         deeplyAligned,\n];\n',
      '  ',
    ],
    [
      'accepts the widest still-plausible indent',
      'const value = [\n        eightWide,\n];\n',
      '        ',
    ],
    [
      'picks the narrowest even when a wider indent comes first',
      'function a() {\n    four();\n}\nfunction b() {\n  two();\n}\n',
      '  ',
    ],
    [
      'picks the narrowest even when the wider indent is more common',
      'function a() {\n    x();\n    y();\n    z();\n}\nfunction b() {\n  q();\n}\n',
      '  ',
    ],
    [
      'reads a tab that is followed by spaces',
      'function a() {\n\t  one();\n}\nfunction b() {\n\t  two();\n}\n',
      '\t',
    ],
    [
      'reads spaces that are followed by a tab',
      'function a() {\n  \tone();\n}\nfunction b() {\n  two();\n}\n',
      '  ',
    ],
    [
      'ignores the body of a template literal',
      'const query = `\n   SELECT *\n   FROM t\n`;\nfunction load() {\n    return 1;\n}\n',
      '    ',
    ],
    [
      'ignores the line a template literal closes on',
      'const run = () => {\n    const query = `\n        SELECT *\n  `;\n\n    return query;\n};\n',
      '    ',
    ],
    [
      'counts every indented line, not just the first',
      'function a() {\n\tone();\n}\nfunction b() {\n  two();\n}\nfunction c() {\n  three();\n}\n',
      '  ',
    ],
  ])('%s', (_title, code, expected) => {
    const step = stepFor(code);
    expect(step).toBe(expected);
  });
});

describe('lineTerminatorOf', () => {
  it.each([
    [
      'reports LF for a unix file',
      'const a = 1;\nconst b = 2;\n',
      '\n',
    ],
    [
      'reports CRLF for a windows file',
      'const a = 1;\r\nconst b = 2;\r\n',
      '\r\n',
    ],
    [
      'reports CRLF when the endings tie',
      'const a = 1;\nconst b = 2;\r\n',
      '\r\n',
    ],
    [
      'reports LF for an LF file with one stray CRLF line',
      'const a = 1;\r\nconst b = 2;\nconst c = 3;\n',
      '\n',
    ],
    [
      'reports CRLF for a CRLF file with one stray LF line',
      'const a = 1;\nconst b = 2;\r\nconst c = 3;\r\n',
      '\r\n',
    ],
    [
      'reports LF for a single-line file',
      'const a = 1;',
      '\n',
    ],
  ])('%s', (_title, code, expected) => {
    const { sourceCode } = sourceCodeFrom(code);
    const terminator = lineTerminatorOf(sourceCode);
    expect(terminator).toBe(expected);
  });
});

describe('getIndent', () => {
  it.each([
    [
      'reads the indentation of the line a node starts on',
      'function load() {\n    return { alpha: 1 };\n}\n',
      'ObjectExpression',
      '    ',
    ],
    [
      'reads the line, not the node column',
      'function load() {\n  const { alpha } = source;\n}\n',
      'ObjectPattern',
      '  ',
    ],
    [
      'returns an empty string at the left margin',
      'const { alpha } = source;\n',
      'ObjectPattern',
      '',
    ],
    [
      'reads a tab indent',
      'function load() {\n\tconst { alpha } = source;\n}\n',
      'ObjectPattern',
      '\t',
    ],
  ])('%s', (_title, code, type, expected) => {
    const { sourceCode, firstNode } = sourceCodeFrom(code);
    const node = firstNode(type);
    const indent = getIndent(sourceCode, node);
    expect(indent).toBe(expected);
  });
});

describe('indentReader', () => {
  it('reports the node column and one step further in', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n  const { alpha } = source;\n}\n');

    const actual = indentReader(sourceCode)(firstNode('ObjectPattern'));
    const expected = {
      outer: '  ',
      inner: '    ',
    };
    expect(actual).toEqual(expected);
  });

  it('adds the step it read off the file rather than assuming two spaces', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const { alpha } = source;\nfunction load() {\n\treturn 1;\n}\n');

    const actual = indentReader(sourceCode)(firstNode('ObjectPattern'));
    const expected = {
      outer: '',
      inner: '\t',
    };
    expect(actual).toEqual(expected);
  });

  it('reads the step once and answers for any node', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n  const { alpha } = source;\n}\n');
    const indentsAt = indentReader(sourceCode);

    const indents = indentsAt(firstNode('ObjectPattern'));
    expect(indents).toEqual(indentsAt(firstNode('ObjectPattern')));

    const indents2 = indentsAt(firstNode('Program'));
    const expected = {
      outer: '',
      inner: '  ',
    };
    expect(indents2).toEqual(expected);
  });
});

describe('sameLine', () => {
  const { sourceCode, firstNode } = sourceCodeFrom('const { alpha, bravo } = source;\nconst other = 1;\n');

  const pattern = firstNode('ObjectPattern');
  const [first, second] = sourceCode.getTokens(pattern);

  it('reports true for two tokens sharing a line', () => {
    const actual = sameLine(first, second);
    expect(actual).toBe(true);
  });

  it('reports false when the second sits on a later line', () => {
    const actual = sameLine(pattern, firstNode('Literal'));
    expect(actual).toBe(false);
  });

  it('reports false when either side carries no location', () => {
    const actual = sameLine({}, second);
    expect(actual).toBe(false);
    const actual2 = sameLine(first, {});
    expect(actual2).toBe(false);
  });

  it('reports false when either side is absent entirely', () => {
    const actual = sameLine(null, second);
    expect(actual).toBe(false);
    const actual2 = sameLine(first, null);
    expect(actual2).toBe(false);
  });

  it('reports false when neither side has a line', () => {
    const actual = sameLine(undefined, undefined);
    expect(actual).toBe(false);
  });
});

const gapAfterComma = (code: string): boolean => {
  return gapIsBlank(sourceCodeFrom(code).sourceCode, code.indexOf(',') + 1, code.indexOf('two'));
};

describe('gapIsBlank', () => {
  it('reports true for a gap holding only whitespace', () => {
    const actual = gapAfterComma('const alpha = [one,\n  two];\n');
    expect(actual).toBe(true);
  });

  it('reports false for a gap holding a comment', () => {
    const actual = gapAfterComma('const alpha = [one, /* keep */ two];\n');
    expect(actual).toBe(false);
  });
});

const linter = new Linter();

const fixWith = (code: string): string => {
  const { output } = linter.verifyAndFix(code, [
    {
      plugins: { '@linteljs': { rules: { 'import-newlines': importNewlines } } },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: { '@linteljs/import-newlines': 'error' },
    },
  ]);

  return output;
};

describe('inferred indentation', () => {
  it('uses two spaces when the file gives nothing to go on', () => {
    const fixed = fixWith("import { alpha, bravo, charlie } from 'mod';\n");

    expect(fixed)
      .toBe("import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';\n");
  });

  it('matches a four-space file rather than imposing two', () => {
    const source = [
      "import { alpha, bravo, charlie } from 'mod';",
      '',
      'function load() {',
      '    return alpha;',
      '}',
      '',
    ].join('\n');

    const fixed = fixWith(source);
    expect(fixed).toContain("import {\n    alpha,\n    bravo,\n    charlie\n} from 'mod';");
  });

  it('matches a tab-indented file', () => {
    const source = [
      "import { alpha, bravo, charlie } from 'mod';",
      '',
      'function load() {',
      '\treturn alpha;',
      '}',
      '',
    ].join('\n');

    const fixed = fixWith(source);
    expect(fixed).toContain("import {\n\talpha,\n\tbravo,\n\tcharlie\n} from 'mod';");
  });

  it('ignores block comment continuation lines', () => {
    const source = [
      '/**',
      ' * A doc block, whose continuation lines start with a single space.',
      ' */',
      "import { alpha, bravo, charlie } from 'mod';",
      '',
      'function load() {',
      '    return alpha;',
      '}',
      '',
    ].join('\n');

    const fixed = fixWith(source);
    expect(fixed).toContain("import {\n    alpha,\n    bravo,\n    charlie\n} from 'mod';");
  });

  it('falls back to two spaces when the narrowest indent is implausible', () => {
    const source = [
      "import { alpha, bravo, charlie } from 'mod';",
      '',
      'const value = [',
      '              deeplyAligned,',
      '];',
      '',
    ].join('\n');

    const fixed = fixWith(source);
    expect(fixed).toContain("import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';");
  });
});

describe('listGaps', () => {
  const INDENTS = {
    outer: '',
    inner: '  ',
  };

  // Each gap as the text either side of it and the indent it would take.
  const describeGaps = (sourceCode: SourceCode, gaps: ListGap[]): string[][] => {
    return gaps
      .map(([
        before,
        after,
        indent,
      ]) => {
        return [
          sourceCode.text.slice(...rangeOf(before)),
          sourceCode.text.slice(...rangeOf(after)),
          indent,
        ];
      });
  };

  // Opened at the node's own first token, its brace or bracket.
  const gapsOf = (
    sourceCode: SourceCode,
    node: RuleNode,
    items: Parameters<typeof listGaps>[2],
    commaSeparated: boolean,
  ): string[][] => {
    const open = mustFind(sourceCode.getFirstToken(node));

    return describeGaps(sourceCode, listGaps(sourceCode, open, items, INDENTS, commaSeparated));
  };

  const elementsOf = (node: RuleNode) => {
    return node.type === 'ArrayExpression' ? node.elements : [];
  };

  it('finds a gap after the bracket, after each comma and before the close, holes and trailing comma too', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const list = [, alpha, bravo,];');
    const node = firstNode('ArrayExpression');
    const gaps = gapsOf(sourceCode, node, elementsOf(node), true);

    const expected = [
      [
        '[',
        ',',
        '  ',
      ],
      [
        ',',
        'alpha',
        '  ',
      ],
      [
        ',',
        'bravo',
        '  ',
      ],
      [
        ',',
        ']',
        '',
      ],
    ];
    expect(gaps).toEqual(expected);
  });

  it('steps past the parentheses around an element to its comma', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const list = [(alpha), bravo];');
    const node = firstNode('ArrayExpression');
    const gaps = gapsOf(sourceCode, node, elementsOf(node), true);

    const expected = [
      ',',
      'bravo',
      '  ',
    ];
    expect(gaps[1]).toEqual(expected);
  });

  it('breaks after a same-line comment that trails a comma, and before one heading the next line', () => {
    const code = 'const list = [alpha, /* a */ /* b */ bravo,\n  /* c */ charlie];';
    const { sourceCode, firstNode } = sourceCodeFrom(code);
    const node = firstNode('ArrayExpression');
    const gaps = gapsOf(sourceCode, node, elementsOf(node), true);

    const expected = [
      [
        '[',
        'alpha',
        '  ',
      ],
      [
        '/* b */',
        'bravo',
        '  ',
      ],
      [
        ',',
        '/* c */',
        '  ',
      ],
      [
        'charlie',
        ']',
        '',
      ],
    ];
    expect(gaps).toEqual(expected);
  });

  it('reads a TypeScript member as carrying its own delimiter, and a pattern as closing before its annotation', () => {
    const {
      sourceCode,
      firstNode,
      lastNode,
    } = sourceCodeFrom(
      'interface Shape { alpha: string; bravo: number }\nconst { alpha, bravo }: Shape = source;',
      tseslint.parser,
    );
    const body = firstNode('TSInterfaceBody');
    const pattern = firstNode('ObjectPattern');
    const members = [firstNode('TSPropertySignature'), lastNode('TSPropertySignature')];
    const properties = pattern.type === 'ObjectPattern' ? pattern.properties : [];

    const gaps = gapsOf(sourceCode, body, members, false);
    const expected = [
      [
        '{',
        'alpha',
        '  ',
      ],
      [
        ';',
        'bravo',
        '  ',
      ],
      [
        'number',
        '}',
        '',
      ],
    ];
    expect(gaps).toEqual(expected);

    const sourceCodeGaps = gapsOf(sourceCode, pattern, properties, true);
    const expected2 = [
      [
        '{',
        'alpha',
        '  ',
      ],
      [
        ',',
        'bravo',
        '  ',
      ],
      [
        'bravo',
        '}',
        '',
      ],
    ];
    expect(sourceCodeGaps).toEqual(expected2);
  });
});

const arrayGaps = (code: string): ListGap[] => {
  const { sourceCode, firstNode } = sourceCodeFrom(code);
  const node = firstNode('ArrayExpression');
  const elements = node.type === 'ArrayExpression' ? node.elements : [];

  return listGaps(sourceCode, mustFind(sourceCode.getFirstToken(node)), elements, {
    outer: '',
    inner: '  ',
  }, true);
};

describe('gapsToBreak', () => {
  it('leaves a list on one line alone up to the count', () => {
    const toBreak = gapsToBreak(arrayGaps('[alpha, bravo];'), 2);

    expect(toBreak).toEqual([]);
  });

  it('breaks every gap of a list on one line past the count', () => {
    const gaps = arrayGaps('[alpha, bravo, charlie];');
    const toBreak = gapsToBreak(gaps, 2);

    expect(toBreak).toEqual(gaps);
  });

  it('breaks only the gaps a half-split list left on one line, under the count too', () => {
    const gaps = arrayGaps('[alpha,\n  bravo];');
    const toBreak = gapsToBreak(gaps, 2);

    const expected = [gaps[0], gaps[2]];
    expect(toBreak).toEqual(expected);
  });

  it('leaves a list broken at every gap alone past the count', () => {
    const toBreak = gapsToBreak(arrayGaps('[\n  alpha,\n  bravo,\n  charlie\n];'), 2);

    expect(toBreak).toEqual([]);
  });
});

describe('isBlank', () => {
  it('reads a gap with a line between its ends as blank', () => {
    const blank = arrayGaps('[\n  alpha,\n\n  bravo\n];')
      .map(isBlank);

    const expected = [
      false,
      true,
      false,
    ];
    expect(blank).toEqual(expected);
  });
});

describe('breakGaps', () => {
  const fixer = captureFixer();

  it('rewrites each gap it is given to one break at its indent, a gap across lines included', () => {
    const gaps = arrayGaps('[alpha,\n\n  bravo];');
    const fixes = [...breakGaps(gaps, '\r\n')(fixer)];

    const expected = [
      {
        range: [1, 1],
        text: '\r\n  ',
      },
      {
        range: [7, 11],
        text: '\r\n  ',
      },
      {
        range: [16, 16],
        text: '\r\n',
      },
    ];
    expect(fixes).toEqual(expected);
  });
});
