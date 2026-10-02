import { alphabetically } from '@mocks/fixerSamples';
import { Linter, type Rule } from 'eslint';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isSafeToConvert,
  SAFE_DECLARATION_PARENTS,
  sitsInUnsafePosition,
} from './safetyUtils.ts';

import type { RuleNode, SourceCode } from '../../../utils/ruleUtils.ts';
import type { FunctionLike } from './writeUtils.ts';

interface ParsedFunction {
  sourceCode: SourceCode;
  fn: FunctionLike;
}

interface ParseOptions {
  ts?: boolean;
  script?: boolean;
}

const isFunctionLike = (node: RuleNode): node is FunctionLike => {
  return node.type === 'ArrowFunctionExpression'
    || node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression';
};

const parseFunction = (code: string, options: ParseOptions = {}): ParsedFunction => {
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
      plugins: { probe: { rules: { capture } } },
      languageOptions: {
        parser: options.ts ? tseslint.parser : undefined,
        ecmaVersion: 'latest',
        sourceType: options.script ? 'script' : 'module',
      },
      rules: { 'probe/capture': 'error' },
    },
  ]);

  if (!captured) {
    throw new Error(`snippet did not parse: ${code}`);
  }

  const fn = nodes.findLast(isFunctionLike);

  if (!fn) {
    throw new Error(`no function in snippet: ${code}`);
  }

  const parsed = {
    sourceCode: captured,
    fn,
  };

  return parsed;
};

describe('SAFE_DECLARATION_PARENTS', () => {
  it('lists exactly the statement positions a declaration is legal in', () => {
    const legalParents = [
      'BlockStatement',
      'ExportNamedDeclaration',
      'Program',
      'StaticBlock',
      'SwitchCase',
      'TSModuleBlock',
    ];
    const expected = legalParents.toSorted(alphabetically);

    const listed = [...SAFE_DECLARATION_PARENTS];
    const sorted = listed.toSorted(alphabetically);
    expect(sorted).toEqual(expected);
  });
});

describe('sitsInUnsafePosition', () => {
  it.each([
    {
      label: 'the callee of a new expression',
      code: 'const made = new (function () {\n  return 1;\n})();',
      expected: true,
    },
    {
      label: 'a function passed as an argument to new',
      code: 'const made = new Wrapper(function () {\n  return 1;\n});',
      expected: false,
    },
    {
      label: 'a function immediately invoked in Crockford style',
      code: '(function () {\n  run();\n}());',
      expected: true,
    },
    {
      label: 'the same call written with the parentheses around the function',
      code: '(function () {\n  run();\n})();',
      expected: false,
    },
    {
      label: 'a function passed as an ordinary call argument',
      code: 'register(function () {\n  return 1;\n});',
      expected: false,
    },
    {
      label: 'an operand of a unary operator',
      code: 'void function () {\n  run();\n}();',
      expected: true,
    },
  ])('is $expected for $label', ({ code, expected }) => {
    const { sourceCode, fn } = parseFunction(code);

    const actual = sitsInUnsafePosition(sourceCode, fn);
    expect(actual).toBe(expected);
  });

  it('is false for every other parent position an arrow may stand in', () => {
    const positions = [
      'const list = [function () {\n  return 1;\n}];',
      'target = function () {\n  return 1;\n};',
      'export default function () {\n  return 1;\n};',
      '(function () {\n  run();\n});',
      'const service = {\n  value: function () {\n    return 1;\n  }\n};',
      'class Holder {\n  value = function () {\n    return 1;\n  };\n}',
      'function outer() {\n  return function () {\n    return 1;\n  };\n}',
      'const values = [...function () {\n  return [];\n}];',
      'const made = function () {\n  return 1;\n};',
    ];

    for (const code of positions) {
      const { sourceCode, fn } = parseFunction(code);

      const actual = sitsInUnsafePosition(sourceCode, fn);
      expect(actual).toBe(false);
    }
  });
});

describe('isSafeToConvert', () => {
  it.each([
    {
      label: 'an ordinary function with nothing standing in the way',
      code: 'function greet() {\n  return 1;\n}',
      expected: true,
    },
    {
      label: 'a generator',
      code: 'function* walk() {\n  yield 1;\n}',
      expected: false,
    },
    {
      label: 'a method that reaches for super',
      code: 'class Child extends Parent {\n  greet() {\n    return super.greet();\n  }\n}',
      expected: false,
    },
    {
      label: 'a function that reaches for arguments',
      code: 'function greet() {\n  return arguments.length;\n}',
      expected: false,
    },
    {
      label: 'a function that reaches for new.target',
      code: 'function greet() {\n  return !!new.target;\n}',
      expected: false,
    },
    {
      label: 'a function that only constructs something, with no new.target in sight',
      code: 'function build() {\n  return new Service();\n}',
      expected: true,
    },
    {
      label: 'a duplicate parameter name in a sloppy-mode function',
      code: 'function pick(first, second, first) {\n  return first;\n}',
      options: { script: true },
      expected: false,
    },
    {
      label: 'a sloppy-mode function taking a pattern beside its names',
      code: 'function pick({ first }, second) {\n  return first + second;\n}',
      options: { script: true },
      expected: true,
    },
    {
      label: 'an explicit this parameter',
      code: 'function greet(this: Service): string {\n  return "x";\n}',
      options: { ts: true },
      expected: false,
    },
    {
      label: 'an assertion signature',
      code: 'function assertString(value: unknown): asserts value is string {\n  return;\n}',
      options: { ts: true },
      expected: false,
    },
    {
      label: 'an ordinary type predicate, which is not an assertion signature',
      code: 'function isText(value: unknown): value is string {\n  return typeof value === "string";\n}',
      options: { ts: true },
      expected: true,
    },
  ])('is $expected for $label', ({
    code,
    options,
    expected,
  }) => {
    const { sourceCode, fn } = parseFunction(code, options);

    const actual = isSafeToConvert(sourceCode, fn, new WeakSet());
    expect(actual).toBe(expected);
  });

  it('is false when the function is recorded as reading this', () => {
    const { sourceCode, fn } = parseFunction('function greet() {\n  return 1;\n}');
    const containsThis = new WeakSet<FunctionLike>();

    containsThis.add(fn);

    const actual = isSafeToConvert(sourceCode, fn, containsThis);
    expect(actual).toBe(false);
  });
});
