import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isDirective,
  mustFind,
  optionsOf,
  rangeOf,
  rebuildLosesComments,
  resolveVariable,
} from './ruleUtils.ts';

import type { Rule } from 'eslint';

interface ProbeOptions {
  max: number;
}

// Both take the shape rather than RuleNode, so a degenerate argument here needs no cast.
const parsed = sourceCodeFrom([
  'const alpha = 1;',
  '',
  'const beta = (delta) => {',
  '  return delta;',
  '};',
  '',
].join('\n'));

describe('isDirective', () => {
  it('answers for a statement carrying a string directive', () => {
    expect(isDirective({
      type: 'ExpressionStatement',
      directive: 'use client',
    })).toBe(true);
  });

  // typescript-eslint's shape for `run();`: the key is present and undefined, so the key alone would answer wrongly.
  it('declines a statement whose directive key is undefined, or absent', () => {
    expect(isDirective({
      type: 'ExpressionStatement',
      directive: undefined,
    })).toBe(false);
    expect(isDirective({ type: 'VariableDeclaration' })).toBe(false);
  });
});

describe('mustFind', () => {
  it('hands back whatever the lookup found', () => {
    const identifier = parsed.firstNode('Identifier');

    expect(mustFind(parsed.sourceCode.getFirstToken(identifier), 'the first token').value).toBe('alpha');
  });

  // ESLint names the rule and the file; only the rule knows which of its lookups failed.
  it('names the plugin and the lookup when one comes back null', () => {
    expect(() => {
      return mustFind(null, 'the token before a comma');
    }).toThrow('@linteljs/eslint-plugin: the token before a comma was not found, which the parse promises. '
      + 'Please open an issue with the file and the parser it ran under.');
  });

  it('treats undefined, an index past a list, the same way', () => {
    const empty: string[] = [];

    expect(() => {
      return mustFind(empty.at(0), 'the first element');
    }).toThrow('the first element was not found');
  });
});

describe('rangeOf', () => {
  it('hands back the range a parsed node carries', () => {
    expect(rangeOf(parsed.firstNode('Identifier'))).toEqual([6, 11]);
  });

  it('names the plugin when a node carries none', () => {
    expect(() => {
      return rangeOf({});
    }).toThrow(/@linteljs\/eslint-plugin: a parsed node carries no range/);
  });
});

describe('optionsOf', () => {
  // What a rule reads its first option through, from a real run so the context is ESLint's own.
  const optionsFrom = (entry: Linter.RuleEntry): Partial<ProbeOptions> => {
    let read: Partial<ProbeOptions> = {};
    const capture: Rule.RuleModule = {
      meta: { schema: false },
      create: (context) => {
        read = optionsOf<ProbeOptions>(context);

        return {};
      },
    };

    new Linter().verify('', [{
      plugins: { probe: { rules: { capture } } },
      rules: { 'probe/capture': entry },
    }]);

    return read;
  };

  it('answers the first option a rule was configured with', () => {
    expect(optionsFrom(['error', { max: 2 }])).toEqual({ max: 2 });
  });

  // An unconfigured rule reads every option as its default, so it gets an empty object rather than undefined.
  it('answers an empty object where none was given', () => {
    expect(optionsFrom('error')).toEqual({});
  });
});

describe('rebuildLosesComments', () => {
  it('answers whether a comment sits inside the node a fixer would rebuild', () => {
    const commented = sourceCodeFrom('const a = { /* kept */ b: 1 };\n');
    const bare = sourceCodeFrom('const a = { b: 1 };\n');

    expect(rebuildLosesComments(commented.sourceCode, commented.firstNode('ObjectExpression'))).toBe(true);
    expect(rebuildLosesComments(bare.sourceCode, bare.firstNode('ObjectExpression'))).toBe(false);
  });
});

describe('resolveVariable', () => {
  const nested = sourceCodeFrom([
    'const outer = 1;',
    'const shadowed = 2;',
    'const run = () => {',
    '  const shadowed = 3;',
    '  return shadowed;',
    '};',
    '',
  ].join('\n'));
  const scope = nested.sourceCode.getScope(nested.firstNode('ReturnStatement'));

  it('walks up the scope chain to a binding declared outside the reference', () => {
    expect(resolveVariable(scope, 'outer')?.scope.type).toBe('module');
  });

  it('answers the innermost binding when a name is shadowed', () => {
    expect(resolveVariable(scope, 'shadowed')?.scope).toBe(scope);
  });

  it('answers null for a name no scope declares', () => {
    expect(resolveVariable(scope, 'missing')).toBeNull();
  });
});
