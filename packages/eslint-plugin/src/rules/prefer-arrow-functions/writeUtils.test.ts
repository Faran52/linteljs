import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type FunctionLike,
  getFunctionId,
  writeArrowConstant,
  writeArrowFunction,
} from './writeUtils.ts';

import type { Rule } from 'eslint';
import type { RuleNode, SourceCode } from '../../utils/ruleUtils.ts';

interface ParsedFunction {
  sourceCode: SourceCode;
  fn: FunctionLike;
}

// Driven directly with real parsed function nodes, the same way index.ts reaches them.

const isFunctionLike = (node: RuleNode): node is FunctionLike => {
  return node.type === 'ArrowFunctionExpression'
    || node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression';
};

const functionFrom = (code: string): ParsedFunction => {
  const { sourceCode, firstNode } = sourceCodeFrom(code);
  const fn = firstNode('FunctionDeclaration');

  if (!isFunctionLike(fn)) {
    throw new Error(`not a function: ${code}`);
  }

  return {
    sourceCode,
    fn,
  };
};

// Generics and a return type annotation are TypeScript-only syntax, so these fixtures need the TypeScript parser
// rather than @mocks/sourceCodeFrom; component.tsx names a real file rather than a flag asserted from nowhere.
const tsFunctionFrom = (code: string, filename = 'source.ts'): ParsedFunction => {
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
      // Flat config matches against the given filename, and needs an extension ESLint recognises to apply at all.
      files: ['**/*.ts', '**/*.tsx'],
      plugins: { probe: { rules: { capture } } },
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: { 'probe/capture': 'error' },
    },
  ], filename);

  if (!captured) {
    throw new Error(`snippet did not parse: ${code}`);
  }

  const fn = nodes.find(isFunctionLike);

  if (!fn) {
    throw new Error(`no function in snippet: ${code}`);
  }

  return {
    sourceCode: captured,
    fn,
  };
};

describe('getFunctionId', () => {
  it('returns the id of a named function', () => {
    const { fn } = functionFrom('function greet() {\n  return 1;\n}');

    expect(getFunctionId(fn)?.name).toBe('greet');
  });

  it('returns null for an anonymous function', () => {
    const { firstNode } = sourceCodeFrom('export default function () {\n  return 1;\n}');
    const fn = firstNode('FunctionDeclaration');

    if (!isFunctionLike(fn)) {
      throw new Error('not a function');
    }

    expect(getFunctionId(fn)).toBeNull();
  });
});

describe('writeArrowFunction', () => {
  it('writes an empty parameter list and a block body unchanged', () => {
    const { sourceCode, fn } = functionFrom('function greet() {\n  return 1;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('() => {\n  return 1;\n}');
  });

  it('joins multiple parameters with a comma and a space', () => {
    const { sourceCode, fn } = functionFrom('function greet(first, second) {\n  return first;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('(first, second) => {\n  return first;\n}');
  });

  it('carries a destructured parameter across using its own source text', () => {
    const { sourceCode, fn } = functionFrom('function greet({ name }) {\n  return name;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('({ name }) => {\n  return name;\n}');
  });

  it('prefixes async functions with async', () => {
    const { sourceCode, fn } = functionFrom('async function load() {\n  return 1;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('async () => {\n  return 1;\n}');
  });

  it('wraps a concise body in braces and an explicit return', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const greet = () => 1;');
    const fn = firstNode('ArrowFunctionExpression');

    if (!isFunctionLike(fn)) {
      throw new Error('not a function');
    }

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('() => { return 1 }');
  });

  it('writes nothing for generics or a return type when the function carries neither', () => {
    const { sourceCode, fn } = functionFrom('function greet(name) {\n  return name;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('(name) => {\n  return name;\n}');
  });

  it('carries a return type annotation across using its own source text', () => {
    const { sourceCode, fn } = tsFunctionFrom('function greet(name: string): string {\n  return name;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('(name: string): string => {\n  return name;\n}');
  });

  it('carries a generic parameter list across unchanged outside a tsx file', () => {
    const { sourceCode, fn } = tsFunctionFrom('function identity<T>(value: T): T {\n  return value;\n}');

    expect(writeArrowFunction(sourceCode, fn, false)).toBe('<T>(value: T): T => {\n  return value;\n}');
  });

  // A single type parameter in a .tsx file reads as a JSX tag, so the emitter adds a trailing comma to disambiguate.
  it('adds a disambiguating comma to a lone generic parameter in a tsx file', () => {
    const { sourceCode, fn } = tsFunctionFrom(
      'function identity<T>(value: T): T {\n  return value;\n}',
      'component.tsx',
    );

    expect(writeArrowFunction(sourceCode, fn, true)).toBe('<T,>(value: T): T => {\n  return value;\n}');
  });

  it('keeps a constraint when adding the disambiguating comma', () => {
    const { sourceCode, fn } = tsFunctionFrom(
      'function identity<T extends string>(value: T): T {\n  return value;\n}',
      'component.tsx',
    );

    expect(writeArrowFunction(sourceCode, fn, true)).toBe('<T extends string,>(value: T): T => {\n  return value;\n}');
  });

  it('does not add a second comma when one is already there', () => {
    const { sourceCode, fn } = tsFunctionFrom(
      'function identity<T,>(value: T): T {\n  return value;\n}',
      'component.tsx',
    );

    expect(writeArrowFunction(sourceCode, fn, true)).toBe('<T,>(value: T): T => {\n  return value;\n}');
  });

  // Two type parameters are already unambiguous, so the tsx flag adds nothing.
  it('does not disambiguate a generic list with more than one parameter', () => {
    const { sourceCode, fn } = tsFunctionFrom(
      'function pair<A, B>(first: A, second: B): [A, B] {\n  return [first, second];\n}',
      'component.tsx',
    );

    expect(writeArrowFunction(sourceCode, fn, true))
      .toBe('<A, B>(first: A, second: B): [A, B] => {\n  return [first, second];\n}');
  });
});

describe('writeArrowConstant', () => {
  it('binds the arrow to the function\'s own name', () => {
    const { sourceCode, fn } = functionFrom('function greet() {\n  return 1;\n}');

    expect(writeArrowConstant(sourceCode, fn, false)).toBe('const greet = () => {\n  return 1;\n}');
  });

  it('carries parameters and an async prefix through the same as writeArrowFunction', () => {
    const { sourceCode, fn } = functionFrom('async function load(url) {\n  return url;\n}');

    expect(writeArrowConstant(sourceCode, fn, false)).toBe('const load = async (url) => {\n  return url;\n}');
  });
});
