import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  mustFind,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import {
  analyzeProperties,
  endTokenOf,
  type PropertyNode,
  startTokenOf,
} from './boundaryUtils.ts';

import type { Rule } from 'eslint';

// The boundary readers, driven directly rather than through the rule's own fixer. All three node kinds share identical
// comment and blank-line handling, so an `ObjectPattern` fixture covers them without the TypeScript parser.

// A real parsed node always has a `loc`, the same narrowing `checkMembers` relies on
// implicitly; spelled as a guard instead of a cast.
const isPropertyNode = (node: RuleNode): node is PropertyNode => {
  return node.loc != null;
};

// Every node in the snippet, in document order, with `parent` intact: `.properties` on the node carries
// `@types/estree`'s shape rather than `RuleNode`'s, so the parent link is the cast-free way to the members.
const propertiesOf = (code: string): { sourceCode: SourceCode;
  members: PropertyNode[]; } => {
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

  const pattern = nodes.find((node) => {
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

  // A doc comment on its own line above a member is that member's heading, not a blank line above it.
  it('returns a leading comment written on its own line', () => {
    const { sourceCode, members } = propertiesOf('const {\n  /** first */\n  alpha,\n  bravo\n} = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(startTokenOf(sourceCode, alpha));

    if (!token.loc) {
      throw new Error('expected the comment to carry a location');
    }

    expect(token.type).toBe('Block');
    expect(token.loc.start.line).toBe(2);
  });

  // A brace has nothing to trail, so a comment written straight after it heads the first member.
  it('returns a comment written on the same line as the opening brace', () => {
    const { sourceCode, members } = propertiesOf('const { /** first */ alpha, bravo, charlie } = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(startTokenOf(sourceCode, alpha));

    expect(token.type).toBe('Block');
  });

  // A comment on the same line as the token before it belongs to what came before, not what
  // follows: `getCommentsBefore` hands back both.
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
  it('returns the member\'s own last token when nothing trails it', () => {
    const { sourceCode, members } = propertiesOf('const { alpha, bravo } = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    expect(endTokenOf(sourceCode, alpha)).toBe(sourceCode.getLastToken(alpha));
  });

  // A note written right after a member, before its comma, trails that member.
  it('returns a comment trailing the member on the same line', () => {
    const { sourceCode, members } = propertiesOf('const { alpha /* trail */, bravo } = source;');
    const [alpha] = members;

    if (!alpha) {
      throw new Error('expected a first member');
    }

    const token = mustFind(endTokenOf(sourceCode, alpha));

    expect(token.type).toBe('Block');
  });

  // A comment on the line below heads the next member, not this one's trailer.
  it('does not attribute a next-line comment to the member before it', () => {
    const { sourceCode, members } = propertiesOf('const {\n  alpha,\n  // heads bravo\n  bravo\n} = source;');
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

  // A pair still sharing a line inside an otherwise split block is what `consistNewline` reports.
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

  // A doc comment above a member counts as that member's own start line, not a blank gap.
  it('does not read a leading doc comment as a blank line', () => {
    const { sourceCode, members } = propertiesOf('const {\n  /** first */\n  alpha,\n  bravo\n} = source;');

    expect(analyzeProperties(sourceCode, members).hasBlankBetween).toBe(false);
  });

  // A member whose value spans multiple lines drags the block open regardless of where it sits,
  // so this reads every member, not only the ones the pairwise walk visits.
  it('flags a multiline property no matter which member holds it', () => {
    const first = propertiesOf('const { alpha = {\n  first: 1\n}, bravo } = source;');
    const last = propertiesOf('const { alpha, bravo = {\n  first: 1\n} } = source;');

    expect(analyzeProperties(first.sourceCode, first.members).hasMultilineProperty).toBe(true);
    expect(analyzeProperties(last.sourceCode, last.members).hasMultilineProperty).toBe(true);
  });
});
