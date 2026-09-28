import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter, type Rule } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createRule,
  docsUrl,
  isDirective,
  isIdentifierNamed,
  mustFind,
  optionsOf,
  rangeOf,
  rebuildLosesComments,
  resolveVariable,
} from './ruleUtils.ts';

interface ProbeOptions {
  max: number;
}

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
    const directive = isDirective({
      type: 'ExpressionStatement',
      directive: 'use client',
    });

    expect(directive).toBe(true);
  });

  it('declines a statement whose directive key is undefined, or absent', () => {
    const directive = isDirective({
      type: 'ExpressionStatement',
      directive: undefined,
    });

    expect(directive).toBe(false);
    expect(isDirective({ type: 'VariableDeclaration' })).toBe(false);
  });
});

describe('isIdentifierNamed', () => {
  it('answers for an identifier of that name only', () => {
    expect(isIdentifierNamed({
      type: 'Identifier',
      name: 'stylex',
    }, 'stylex')).toBe(true);
    expect(isIdentifierNamed({
      type: 'Identifier',
      name: 'css',
    }, 'stylex')).toBe(false);
    expect(isIdentifierNamed({
      type: 'PrivateIdentifier',
      name: 'stylex',
    }, 'stylex')).toBe(false);
  });
});

describe('mustFind', () => {
  it('hands back whatever the lookup found', () => {
    const identifier = parsed.firstNode('Identifier');

    expect(mustFind(parsed.sourceCode.getFirstToken(identifier)).value).toBe('alpha');
  });

  it('names the plugin and asks for an issue when one comes back null', () => {
    expect(() => {
      return mustFind(null);
    }).toThrow('@linteljs/eslint-plugin: a lookup the parse promises came back empty. '
      + 'Please open an issue with the file and the parser it ran under.');
  });

  it('treats undefined, an index past a list, the same way', () => {
    const empty: string[] = [];

    expect(() => {
      return mustFind(empty.at(0));
    }).toThrow('a lookup the parse promises came back empty');
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

describe('docsUrl', () => {
  it('builds the rule directory url from the rule id', () => {
    expect(docsUrl('import-newlines'))
      .toBe('https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/import-newlines');
  });

  it('points at a tree url rather than a blob url', () => {
    expect(docsUrl('prefer-arrow-functions')).toContain('/tree/main/');
    expect(docsUrl('prefer-arrow-functions')).not.toContain('/blob/');
  });
});

describe('createRule', () => {
  const definition: Parameters<typeof createRule>[1] = {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'A rule for exercising createRule.',
        language: 'universal',
        recommended: true,
      },
      messages: { example: 'An example message.' },
      schema: [],
    },
    create: () => {
      return {};
    },
  };

  it('derives the docs url from the rule name it is given, not from anything on the definition', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.docs.url)
      .toBe('https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/example-rule');
  });

  it('carries every other docs field through unchanged', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.docs.description).toBe('A rule for exercising createRule.');
    expect(rule.meta.docs.language).toBe('universal');
    expect(rule.meta.docs.language).toBe('universal');
    expect(rule.meta.docs.recommended).toBe(true);
  });

  it('carries the rest of meta through unchanged', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.type).toBe('suggestion');
    expect(rule.meta.messages).toEqual({ example: 'An example message.' });
    expect(rule.meta.schema).toEqual([]);
  });

  it('carries the create function through by reference', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.create).toBe(definition.create);
  });

  it('does not write the url back onto the definition passed in', () => {
    createRule('example-rule', definition);

    expect('url' in definition.meta.docs).toBe(false);
  });
});
