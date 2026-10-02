import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter, type Rule } from 'eslint';
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

import type { RuleNode, SourceCode } from '../../../utils/ruleUtils.ts';

interface ParsedFunction {
  sourceCode: SourceCode;
  fn: FunctionLike;
}

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

  const parsed = {
    sourceCode,
    fn,
  };

  return parsed;
};

const tsFunctionFrom = (code: string, filename = 'source.ts'): ParsedFunction => {
  const linter = new Linter();
  const nodes: RuleNode[] = [];
  let captured: SourceCode | undefined;

  const capture: Rule.RuleModule = {
    create: (context) => {
      captured = context.sourceCode;

      const listeners = {
        '*': (node: RuleNode) => {
          nodes.push(node);
        },
      };

      return listeners;
    },
  };

  linter.verify(code, [
    {
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

  const parsed = {
    sourceCode: captured,
    fn,
  };

  return parsed;
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

    const functionId = getFunctionId(fn);
    expect(functionId).toBeNull();
  });
});

describe('writeArrowFunction', () => {
  it.each([
    [
      'writes an empty parameter list and a block body unchanged',
      'function greet() {\n  return 1;\n}',
      '() => {\n  return 1;\n}',
    ],
    [
      'joins multiple parameters with a comma and a space',
      'function greet(first, second) {\n  return first;\n}',
      '(first, second) => {\n  return first;\n}',
    ],
    [
      'carries a destructured parameter across using its own source text',
      'function greet({ name }) {\n  return name;\n}',
      '({ name }) => {\n  return name;\n}',
    ],
    [
      'prefixes async functions with async',
      'async function load() {\n  return 1;\n}',
      'async () => {\n  return 1;\n}',
    ],
    [
      'writes nothing for generics or a return type when the function carries neither',
      'function greet(name) {\n  return name;\n}',
      '(name) => {\n  return name;\n}',
    ],
  ])('%s', (_label, code, expected) => {
    const { sourceCode, fn } = functionFrom(code);

    const arrow = writeArrowFunction(sourceCode, fn, false);
    expect(arrow).toBe(expected);
  });

  it('wraps a concise body in braces and an explicit return', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const greet = () => 1;');
    const fn = firstNode('ArrowFunctionExpression');

    if (!isFunctionLike(fn)) {
      throw new Error('not a function');
    }

    const arrow = writeArrowFunction(sourceCode, fn, false);
    expect(arrow).toBe('() => { return 1 }');
  });

  it.each([
    [
      'carries a return type annotation across using its own source text',
      'function greet(name: string): string {\n  return name;\n}',
      'source.ts',
      false,
      '(name: string): string => {\n  return name;\n}',
    ],
    [
      'carries a generic parameter list across unchanged outside a tsx file',
      'function identity<T>(value: T): T {\n  return value;\n}',
      'source.ts',
      false,
      '<T>(value: T): T => {\n  return value;\n}',
    ],
    [
      'adds a disambiguating comma to a lone generic parameter in a tsx file',
      'function identity<T>(value: T): T {\n  return value;\n}',
      'component.tsx',
      true,
      '<T,>(value: T): T => {\n  return value;\n}',
    ],
    [
      'keeps a constraint when adding the disambiguating comma',
      'function identity<T extends string>(value: T): T {\n  return value;\n}',
      'component.tsx',
      true,
      '<T extends string,>(value: T): T => {\n  return value;\n}',
    ],
    [
      'does not add a second comma when one is already there',
      'function identity<T,>(value: T): T {\n  return value;\n}',
      'component.tsx',
      true,
      '<T,>(value: T): T => {\n  return value;\n}',
    ],
    [
      'does not disambiguate a generic list with more than one parameter',
      'function pair<A, B>(first: A, second: B): [A, B] {\n  return [first, second];\n}',
      'component.tsx',
      true,
      '<A, B>(first: A, second: B): [A, B] => {\n  return [first, second];\n}',
    ],
  ])('%s', (_label, code, filename, isTsx, expected) => {
    const { sourceCode, fn } = tsFunctionFrom(code, filename);

    const arrow = writeArrowFunction(sourceCode, fn, isTsx);
    expect(arrow).toBe(expected);
  });
});

describe('writeArrowConstant', () => {
  it('binds the arrow to the function\'s own name', () => {
    const { sourceCode, fn } = functionFrom('function greet() {\n  return 1;\n}');

    const actual = writeArrowConstant(sourceCode, fn, false);
    expect(actual).toBe('const greet = () => {\n  return 1;\n}');
  });

  it('carries parameters and an async prefix through the same as writeArrowFunction', () => {
    const { sourceCode, fn } = functionFrom('async function load(url) {\n  return url;\n}');

    const actual = writeArrowConstant(sourceCode, fn, false);
    expect(actual).toBe('const load = async (url) => {\n  return url;\n}');
  });
});
