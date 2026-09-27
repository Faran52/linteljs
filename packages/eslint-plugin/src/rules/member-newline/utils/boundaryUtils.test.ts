import { Linter, type Rule } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  mustFind,
  type RuleNode,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

import {
  analyzeProperties,
  endTokenOf,
  type PropertyNode,
  startTokenOf,
} from './boundaryUtils.ts';

interface ParsedProperties {
  sourceCode: SourceCode;
  members: PropertyNode[];
}

const isPropertyNode = (node: RuleNode): node is PropertyNode => {
  return node.loc != null;
};

const propertiesOf = (code: string): ParsedProperties => {
  const linter = new Linter();
  const nodes: RuleNode[] = [];
  let captured: SourceCode | undefined;

  const capture: Rule.RuleModule = {
    create: (context) => {
      captured = context.sourceCode;

      return {
        '*': (node: RuleNode) => {
          nodes.push(node);
        },
      };
    },
  };

  linter.verify(code, [
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
    throw new Error(`snippet did not parse: ${code}`);
  }

  const pattern = nodes
    .find((node) => {
      return node.type === 'ObjectPattern';
    });

  if (!pattern) {
    throw new Error(`no object pattern in snippet: ${code}`);
  }

  const members = nodes
    .filter((node) => {
      return node.parent === pattern;
    })
    .filter(isPropertyNode);

  return {
    sourceCode: captured,
    members,
  };
};

describe('startTokenOf', () => {
  it('returns the member\'s own first token when nothing heads it', () => {
    const { sourceCode, members } = propertiesOf('const { alpha, bravo } = source;');
    const [, bravo] = members;

    if (!bravo) {
      throw new Error('expected a second member');
    }

    expect(startTokenOf(sourceCode, bravo)).toBe(sourceCode.getFirstToken(bravo));
  });

  it('returns a leading comment written on its own line', () => {
    const { sourceCode, members } = propertiesOf('const {\n  /** first */\n  alpha,\n  bravo\n} = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(startTokenOf(sourceCode, alpha), 'the first token of alpha');

    if (!token.loc) {
      throw new Error('expected the comment to carry a location');
    }

    expect(token.type).toBe('Block');
    expect(token.loc.start.line).toBe(2);
  });

  it('returns a comment written on the same line as the opening brace', () => {
    const { sourceCode, members } = propertiesOf('const { /** first */ alpha, bravo, charlie } = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(startTokenOf(sourceCode, alpha), 'the first token of alpha');

    expect(token.type).toBe('Block');
  });

  it('does not attribute a same-line trailing comment to the member after it', () => {
    const { sourceCode, members } = propertiesOf('const { alpha, /* trailing */ bravo, charlie } = source;');
    const [, bravo] = members;

    if (!bravo) {
      throw new Error('expected a second member');
    }

    expect(startTokenOf(sourceCode, bravo)).toBe(sourceCode.getFirstToken(bravo));
  });
});

describe('endTokenOf', () => {
  it('returns a comment trailing the member on the same line', () => {
    const { sourceCode, members } = propertiesOf('const { alpha /* trail */, bravo } = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(endTokenOf(sourceCode, alpha), 'the last token of alpha');

    expect(token.type).toBe('Block');
  });

  it.each([
    ['nothing trails it', 'const { alpha, bravo } = source;'],
    ['a next-line comment heads the next member', 'const {\n  alpha,\n  // heads bravo\n  bravo\n} = source;'],
    ['a next-line comment closes the block', 'const {\n  alpha\n  // closes the block\n} = source;'],
  ])('returns the member\'s own last token when %s', (_label, code) => {
    const { sourceCode, members } = propertiesOf(code);
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    expect(endTokenOf(sourceCode, alpha)).toBe(sourceCode.getLastToken(alpha));
  });
});

describe('analyzeProperties', () => {
  it('reports a single-line block as neither multiline nor holding a blank gap', () => {
    const { sourceCode, members } = propertiesOf('const { alpha, bravo } = source;');

    expect(analyzeProperties(sourceCode, members)).toEqual({
      isMultiLine: false,
      hasSameLinePairs: true,
      hasBlankBetween: false,
      hasMultilineProperty: false,
    });
  });

  it('reports a fully split block with none of the extra flags set', () => {
    const { sourceCode, members } = propertiesOf('const {\n  alpha,\n  bravo,\n  charlie\n} = source;');

    expect(analyzeProperties(sourceCode, members)).toEqual({
      isMultiLine: true,
      hasSameLinePairs: false,
      hasBlankBetween: false,
      hasMultilineProperty: false,
    });
  });

  it('flags a pair that still shares a line inside an otherwise split block', () => {
    const { sourceCode, members } = propertiesOf('const {\n  alpha, bravo,\n  charlie\n} = source;');

    const result = analyzeProperties(sourceCode, members);

    expect(result.isMultiLine).toBe(true);
    expect(result.hasSameLinePairs).toBe(true);
  });

  it('flags a blank line between two members', () => {
    const { sourceCode, members } = propertiesOf('const {\n  alpha,\n\n  bravo\n} = source;');

    expect(analyzeProperties(sourceCode, members).hasBlankBetween).toBe(true);
  });

  it('does not read a leading doc comment as a blank line', () => {
    const { sourceCode, members } = propertiesOf('const {\n  /** first */\n  alpha,\n  bravo\n} = source;');

    expect(analyzeProperties(sourceCode, members).hasBlankBetween).toBe(false);
  });

  it('measures the gap above a later member from the comment heading it', () => {
    const tight = propertiesOf('const {\n  alpha,\n  // heads bravo\n  bravo\n} = source;');
    const spaced = propertiesOf('const {\n  alpha,\n\n  // heads bravo\n  bravo\n} = source;');

    expect(analyzeProperties(tight.sourceCode, tight.members).hasBlankBetween).toBe(false);
    expect(analyzeProperties(spaced.sourceCode, spaced.members).hasBlankBetween).toBe(true);
  });

  it('flags a multiline property no matter which member holds it', () => {
    const first = propertiesOf('const { alpha = {\n  first: 1\n}, bravo } = source;');
    const last = propertiesOf('const { alpha, bravo = {\n  first: 1\n} } = source;');

    expect(analyzeProperties(first.sourceCode, first.members).hasMultilineProperty).toBe(true);
    expect(analyzeProperties(last.sourceCode, last.members).hasMultilineProperty).toBe(true);
  });
});
