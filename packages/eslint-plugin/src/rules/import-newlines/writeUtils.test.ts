import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type ImportNode, writeImport } from './writeUtils.ts';

import type { RuleNode, SourceCode } from '../../utils/ruleUtils.ts';

// The `importKind === 'type'` branch cannot be reached from plain JS fixtures here; it's covered via tsRuleTester in
// index.test.ts.

const isImportNode = (node: RuleNode): node is ImportNode => {
  return node.type === 'ImportDeclaration';
};

const importNodeFrom = (code: string): { sourceCode: SourceCode;
  node: ImportNode; } => {
  const { sourceCode, firstNode } = sourceCodeFrom(code);
  const node = firstNode('ImportDeclaration');

  if (!isImportNode(node)) {
    throw new Error(`not an import: ${code}`);
  }

  return {
    sourceCode,
    node,
  };
};

describe('writeImport', () => {
  it('collapses a split named clause onto one line when indents is null', () => {
    const { sourceCode, node } = importNodeFrom("import {\n  alpha,\n  bravo\n} from 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBe("import { alpha, bravo } from 'mod';");
  });

  it('splits a named clause across the given indents', () => {
    const { sourceCode, node } = importNodeFrom("import { alpha, bravo } from 'mod';");

    expect(writeImport(sourceCode, node, {
      outer: '',
      inner: '  ',
    }, '\n'))
      .toBe("import {\n  alpha,\n  bravo\n} from 'mod';");
  });

  // The split form steps in from the statement's own column, not from zero.
  it('anchors the split at the outer indent it is given', () => {
    const { sourceCode, node } = importNodeFrom("  import { alpha, bravo } from 'mod';");

    expect(writeImport(sourceCode, node, {
      outer: '  ',
      inner: '    ',
    }, '\n'))
      .toBe("import {\n    alpha,\n    bravo\n  } from 'mod';");
  });

  it('writes the line terminator it is given rather than assuming LF', () => {
    const { sourceCode, node } = importNodeFrom("import { alpha, bravo } from 'mod';");

    expect(writeImport(sourceCode, node, {
      outer: '',
      inner: '  ',
    }, '\r\n'))
      .toBe("import {\r\n  alpha,\r\n  bravo\r\n} from 'mod';");
  });

  it('keeps a default import ahead of the named clause', () => {
    const { sourceCode, node } = importNodeFrom("import alpha, { bravo, charlie } from 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBe("import alpha, { bravo, charlie } from 'mod';");
  });

  it('keeps a namespace import ahead of the named clause', () => {
    const { sourceCode, node } = importNodeFrom("import alpha, * as namespace from 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBe("import alpha, * as namespace from 'mod';");
  });

  it('writes a default import with no named clause at all', () => {
    const { sourceCode, node } = importNodeFrom("import alpha from 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBe("import alpha from 'mod';");
  });

  // This emitter has no guard for a side-effect import; index.ts's early return is what prevents reaching it. Pinned so
  // that guard is not deleted as dead code.
  it('writes an unparseable statement for an import with no specifiers, which callers must guard against', () => {
    const { sourceCode, node } = importNodeFrom("import 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBe("import  from 'mod';");
  });

  // An import attribute clause sits after the module specifier, so it needs an explicit slice to survive the rebuild.
  it('carries an import attribute clause across the rebuild', () => {
    const { sourceCode, node } = importNodeFrom(
      "import { alpha, bravo } from 'mod' with { type: 'json' };",
    );

    expect(writeImport(sourceCode, node, {
      outer: '',
      inner: '  ',
    }, '\n'))
      .toBe("import {\n  alpha,\n  bravo\n} from 'mod' with { type: 'json' };");
  });

  // A comment inside the braces cannot be carried across a rebuild assembled from specifier text alone.
  it('returns null when a comment sits inside the statement', () => {
    const { sourceCode, node } = importNodeFrom("import { alpha, /* keep */ bravo } from 'mod';");

    expect(writeImport(sourceCode, node, {
      outer: '',
      inner: '  ',
    }, '\n')).toBeNull();
  });

  // The same rebuild path serves the collapse check, so a comment declines it too, not only the split.
  it('returns null for the collapsed form as well, given the same comment', () => {
    const { sourceCode, node } = importNodeFrom("import {\n  alpha,\n  /* keep */ bravo\n} from 'mod';");

    expect(writeImport(sourceCode, node, null, '\n')).toBeNull();
  });
});
