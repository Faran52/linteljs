import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { importNewlines } from '../rules/import-newlines/index.ts';
import { type Fixer, mustFind } from '../utils/ruleUtils.ts';

import {
  adjacentPairs,
  fixCommaToNewline,
  gapIsBlank,
  getIndent,
  getIndentStep,
  indentReader,
  lineTerminatorOf,
  sameLine,
  spliceOntoNewline,
} from './layoutUtils.ts';

import type { Rule } from 'eslint';

const stepFor = (code: string): string => {
  return getIndentStep(sourceCodeFrom(code).sourceCode);
};

describe('adjacentPairs', () => {
  it('pairs each item with the one before it', () => {
    expect([...adjacentPairs(['a', 'b', 'c'])]).toEqual([['a', 'b'], ['b', 'c']]);
  });

  it('yields nothing for a list too short to hold a pair', () => {
    expect([...adjacentPairs(['only'])]).toEqual([]);
    expect([...adjacentPairs([])]).toEqual([]);
  });

  // Array holes parse as null; a pair with one must still arrive, since the rule is what decides to skip it.
  it('carries a null member through as a side of a pair', () => {
    expect([...adjacentPairs([null, null, 'third'])])
      .toEqual([[null, null], [null, 'third']]);
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

  // Widths must be sorted, not sampled, since the narrowest should win regardless of order.
  it('picks the narrowest even when a wider indent comes first', () => {
    expect(stepFor('function a() {\n    four();\n}\nfunction b() {\n  two();\n}\n')).toBe('  ');
  });

  it('picks the narrowest even when the wider indent is more common', () => {
    expect(stepFor('function a() {\n    x();\n    y();\n    z();\n}\nfunction b() {\n  q();\n}\n')).toBe('  ');
  });

  // A tab followed by spaces is a tab indent; testing the run's end instead of its start would misread it as spaces.
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

  // The closing backtick's line indentation is part of the template too, not a step.
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

  it('reports CRLF when only one line uses it', () => {
    expect(lineTerminatorOf(sourceCodeFrom('const a = 1;\nconst b = 2;\r\n').sourceCode)).toBe('\r\n');
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

  // Only a hand-built AST omits a location; answering true here would let a fixer rewrite a gap it can't see.
  it('reports false when either side carries no location', () => {
    expect(sameLine({}, second)).toBe(false);
    expect(sameLine(first, {})).toBe(false);
  });

  // A token lookup answers null at the file's edge; both parameters accept it rather than throwing.
  it('reports false when either side is absent entirely', () => {
    expect(sameLine(null, second)).toBe(false);
    expect(sameLine(first, null)).toBe(false);
  });

  // undefined === undefined would wrongly read two unknown lines as the same line, letting a
  // fixer splice a gap it has no positions for.
  it('reports false when neither side has a line', () => {
    expect(sameLine(undefined, undefined)).toBe(false);
  });
});

// A real Rule.RuleFixer, captured from a throwaway rule rather than stubbed, since a stub would
// test the stub, not the real object.
const captureFixer = (): Fixer => {
  let captured: Fixer | undefined;

  const capture: Rule.RuleModule = {
    meta: { fixable: 'whitespace' },
    create: (context) => {
      return {
        Identifier: (node) => {
          context.report({
            node,
            message: 'probe',
            fix: (fixer) => {
              captured = fixer;

              return null;
            },
          });
        },
      };
    },
  };

  new Linter().verify('const alpha = 1;\n', [
    {
      plugins: { probe: { rules: { capture } } },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: { 'probe/capture': 'error' },
    },
  ]);

  if (!captured) {
    throw new Error('no fixer captured');
  }

  return captured;
};

describe('spliceOntoNewline', () => {
  const fixer = captureFixer();

  // Anchors here come from token lookups allowed to miss, so each has to survive the miss rather than throw.
  it('yields nothing when both anchors are absent', () => {
    expect([...spliceOntoNewline(fixer, null, null, '  ', '\n')]).toEqual([]);
  });

  it('yields nothing when both anchors carry no location', () => {
    expect([...spliceOntoNewline(fixer, {}, {}, '  ', '\n')]).toEqual([]);
  });

  // A range with no location passes the line test, leaving the range test as the only guard left.
  it('yields nothing when only the first anchor carries a range', () => {
    expect([...spliceOntoNewline(fixer, { range: [0, 1] }, null, '  ', '\n')]).toEqual([]);
  });
});

describe('fixCommaToNewline', () => {
  // Both callers pass an indent today; nothing else pins what the default writes, so this test does.
  it('writes a bare line break when no indent is given', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const alpha = [one, two];\n');
    const second = mustFind(sourceCode.getLastToken(firstNode('ArrayExpression'), 1));

    expect(fixCommaToNewline(sourceCode, captureFixer(), second)?.text).toBe('\n');
  });
});

// The gap a fixer rewrites runs from the separator to the next item, so this measures from the
// comma, not the item before it.
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

// Confirms the indent step actually reaches the fixer's output, not just detection.
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
