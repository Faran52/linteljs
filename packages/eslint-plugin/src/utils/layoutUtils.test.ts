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
    expect([...adjacentPairs([
      'a',
      'b',
      'c',
    ])]).toEqual([['a', 'b'], ['b', 'c']]);
  });

  it('yields nothing for a list too short to hold a pair', () => {
    expect([...adjacentPairs(['only'])]).toEqual([]);
    expect([...adjacentPairs([])]).toEqual([]);
  });

  it('carries a null member through as a side of a pair', () => {
    expect([...adjacentPairs([
      null,
      null,
      'third',
    ])])
      .toEqual([[null, null], [null, 'third']]);
  });
});

describe('lineSpan', () => {
  it('lists both ends', () => {
    expect(lineSpan(3, 5)).toEqual([
      3,
      4,
      5,
    ]);
    expect(lineSpan(4, 4)).toEqual([4]);
  });

  it('is empty when last falls before first', () => {
    expect(lineSpan(5, 4)).toEqual([]);
    expect(lineSpan(5, 2)).toEqual([]);
  });
});

describe('linesInsideTokens', () => {
  it('holds the continuation lines of a multi-line token only', () => {
    const { sourceCode } = sourceCodeFrom('const a = `x\ny\nz`;\nconst b = 1;');

    expect([...linesInsideTokens(sourceCode)]).toEqual([2, 3]);
  });
});

describe('getIndentStep', () => {
  it('reads two spaces from a two-space file', () => {
    expect(stepFor('function load() {\n  return 1;\n}\n')).toBe('  ');
  });

  it('reads four spaces from a four-space file', () => {
    expect(stepFor('function load() {\n    return 1;\n}\n')).toBe('    ');
  });

  it('takes the narrowest indent, not the deepest', () => {
    expect(stepFor('function load() {\n  if (ready) {\n    return 1;\n  }\n}\n')).toBe('  ');
  });

  it('reads a tab from a tab-indented file', () => {
    expect(stepFor('function load() {\n\treturn 1;\n}\n')).toBe('\t');
  });

  it('prefers spaces when they outnumber tabs', () => {
    expect(stepFor('function a() {\n  return 1;\n}\nfunction b() {\n  return 2;\n}\nfunction c() {\n\treturn 3;\n}\n'))
      .toBe('  ');
  });

  it('prefers tabs when they are at least as common', () => {
    expect(stepFor('function a() {\n\treturn 1;\n}\nfunction b() {\n  return 2;\n}\n')).toBe('\t');
  });

  it('falls back to two spaces when nothing is indented', () => {
    expect(stepFor('const value = 1;\nconst other = 2;\n')).toBe('  ');
  });

  it('ignores block comment continuation lines', () => {
    expect(stepFor('/**\n * A doc block.\n */\nfunction load() {\n    return 1;\n}\n')).toBe('    ');
  });

  it('falls back to two spaces when the narrowest indent is a single space', () => {
    expect(stepFor('const value = [\n mis,\n aligned,\n];\n')).toBe('  ');
  });

  it('falls back to two spaces when the narrowest indent is implausibly wide', () => {
    expect(stepFor('const value = [\n         deeplyAligned,\n];\n')).toBe('  ');
  });

  it('accepts the widest still-plausible indent', () => {
    expect(stepFor('const value = [\n        eightWide,\n];\n')).toBe('        ');
  });

  it('picks the narrowest even when a wider indent comes first', () => {
    expect(stepFor('function a() {\n    four();\n}\nfunction b() {\n  two();\n}\n')).toBe('  ');
  });

  it('picks the narrowest even when the wider indent is more common', () => {
    expect(stepFor('function a() {\n    x();\n    y();\n    z();\n}\nfunction b() {\n  q();\n}\n')).toBe('  ');
  });

  it('reads a tab that is followed by spaces', () => {
    expect(stepFor('function a() {\n\t  one();\n}\nfunction b() {\n\t  two();\n}\n')).toBe('\t');
  });

  it('reads spaces that are followed by a tab', () => {
    expect(stepFor('function a() {\n  \tone();\n}\nfunction b() {\n  two();\n}\n')).toBe('  ');
  });

  it('ignores the body of a template literal', () => {
    expect(stepFor('const query = `\n   SELECT *\n   FROM t\n`;\nfunction load() {\n    return 1;\n}\n'))
      .toBe('    ');
  });

  it('ignores the line a template literal closes on', () => {
    expect(stepFor('const run = () => {\n    const query = `\n        SELECT *\n  `;\n\n    return query;\n};\n'))
      .toBe('    ');
  });

  it('counts every indented line, not just the first', () => {
    expect(stepFor('function a() {\n\tone();\n}\nfunction b() {\n  two();\n}\nfunction c() {\n  three();\n}\n'))
      .toBe('  ');
  });
});

describe('lineTerminatorOf', () => {
  it('reports LF for a unix file', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\nconst b = 2;\n').sourceCode)).toBe('\n');
  });

  it('reports CRLF for a windows file', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\r\nconst b = 2;\r\n').sourceCode)).toBe('\r\n');
  });

  it('reports CRLF when the endings tie', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\nconst b = 2;\r\n').sourceCode)).toBe('\r\n');
  });

  it('reports LF for an LF file with one stray CRLF line', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\r\nconst b = 2;\nconst c = 3;\n').sourceCode)).toBe('\n');
  });

  it('reports CRLF for a CRLF file with one stray LF line', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\nconst b = 2;\r\nconst c = 3;\r\n').sourceCode)).toBe('\r\n');
  });

  it('reports LF for a single-line file', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;').sourceCode)).toBe('\n');
  });
});

describe('getIndent', () => {
  it('reads the indentation of the line a node starts on', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n    return { alpha: 1 };\n}\n');

    expect(getIndent(sourceCode, firstNode('ObjectExpression'))).toBe('    ');
  });

  it('reads the line, not the node column', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n  const { alpha } = source;\n}\n');

    expect(getIndent(sourceCode, firstNode('ObjectPattern'))).toBe('  ');
  });

  it('returns an empty string at the left margin', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const { alpha } = source;\n');

    expect(getIndent(sourceCode, firstNode('ObjectPattern'))).toBe('');
  });

  it('reads a tab indent', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n\tconst { alpha } = source;\n}\n');

    expect(getIndent(sourceCode, firstNode('ObjectPattern'))).toBe('\t');
  });
});

describe('indentReader', () => {
  it('reports the node column and one step further in', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n  const { alpha } = source;\n}\n');

    expect(indentReader(sourceCode)(firstNode('ObjectPattern'))).toEqual({
      outer: '  ',
      inner: '    ',
    });
  });

  it('adds the step it read off the file rather than assuming two spaces', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const { alpha } = source;\nfunction load() {\n\treturn 1;\n}\n');

    expect(indentReader(sourceCode)(firstNode('ObjectPattern'))).toEqual({
      outer: '',
      inner: '\t',
    });
  });

  it('reads the step once and answers for any node', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('function load() {\n  const { alpha } = source;\n}\n');
    const indentsAt = indentReader(sourceCode);

    expect(indentsAt(firstNode('ObjectPattern'))).toEqual(indentsAt(firstNode('ObjectPattern')));
    expect(indentsAt(firstNode('Program'))).toEqual({
      outer: '',
      inner: '  ',
    });
  });
});

describe('sameLine', () => {
  const { sourceCode, firstNode } = sourceCodeFrom('const { alpha, bravo } = source;\nconst other = 1;\n');

  const pattern = firstNode('ObjectPattern');
  const [first, second] = sourceCode.getTokens(pattern);

  it('reports true for two tokens sharing a line', () => {
    expect(sameLine(first, second)).toBe(true);
  });

  it('reports false when the second sits on a later line', () => {
    expect(sameLine(pattern, firstNode('Literal'))).toBe(false);
  });

  it('reports false when either side carries no location', () => {
    expect(sameLine({}, second)).toBe(false);
    expect(sameLine(first, {})).toBe(false);
  });

  it('reports false when either side is absent entirely', () => {
    expect(sameLine(null, second)).toBe(false);
    expect(sameLine(first, null)).toBe(false);
  });

  it('reports false when neither side has a line', () => {
    expect(sameLine(undefined, undefined)).toBe(false);
  });
});

const gapAfterComma = (code: string): boolean => {
  return gapIsBlank(sourceCodeFrom(code).sourceCode, code.indexOf(',') + 1, code.indexOf('two'));
};

describe('gapIsBlank', () => {
  it('reports true for a gap holding only whitespace', () => {
    expect(gapAfterComma('const alpha = [one,\n  two];\n')).toBe(true);
  });

  it('reports false for a gap holding a comment', () => {
    expect(gapAfterComma('const alpha = [one, /* keep */ two];\n')).toBe(false);
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
    expect(fixWith("import { alpha, bravo, charlie } from 'mod';\n"))
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

    expect(fixWith(source)).toContain("import {\n    alpha,\n    bravo,\n    charlie\n} from 'mod';");
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

    expect(fixWith(source)).toContain("import {\n\talpha,\n\tbravo,\n\tcharlie\n} from 'mod';");
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

    expect(fixWith(source)).toContain("import {\n    alpha,\n    bravo,\n    charlie\n} from 'mod';");
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

    expect(fixWith(source)).toContain("import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';");
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

    expect(gaps).toEqual([
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
    ]);
  });

  it('steps past the parentheses around an element to its comma', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const list = [(alpha), bravo];');
    const node = firstNode('ArrayExpression');
    const gaps = gapsOf(sourceCode, node, elementsOf(node), true);

    expect(gaps[1]).toEqual([
      ',',
      'bravo',
      '  ',
    ]);
  });

  it('breaks after a same-line comment that trails a comma, and before one heading the next line', () => {
    const code = 'const list = [alpha, /* a */ /* b */ bravo,\n  /* c */ charlie];';
    const { sourceCode, firstNode } = sourceCodeFrom(code);
    const node = firstNode('ArrayExpression');
    const gaps = gapsOf(sourceCode, node, elementsOf(node), true);

    expect(gaps).toEqual([
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
    ]);
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

    expect(gapsOf(sourceCode, body, members, false)).toEqual([
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
    ]);
    expect(gapsOf(sourceCode, pattern, properties, true)).toEqual([
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
    ]);
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

    expect(toBreak).toEqual([gaps[0], gaps[2]]);
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

    expect(blank).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe('breakGaps', () => {
  const fixer = captureFixer();

  it('rewrites each gap it is given to one break at its indent, a gap across lines included', () => {
    const gaps = arrayGaps('[alpha,\n\n  bravo];');
    const fixes = [...breakGaps(gaps, '\r\n')(fixer)];

    expect(fixes).toEqual([
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
    ]);
  });
});
