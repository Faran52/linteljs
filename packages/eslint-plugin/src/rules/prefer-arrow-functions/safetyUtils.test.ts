import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isInsideFunctionBody,
  isSafeToConvert,
  SAFE_DECLARATION_PARENTS,
  sitsInUnsafePosition,
} from './safetyUtils.ts';

import type { Rule } from 'eslint';
import type { RuleNode, SourceCode } from '../../utils/ruleUtils.ts';
import type { FunctionLike } from './writeUtils.ts';

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

// Finds the last function-like node via a real Linter run, not @mocks/sourceCodeFrom, which returns only the first node
// of a type; the ts/script options serve fixtures needing the TypeScript parser or a non-strict sourceType.
const parseFunction = (code: string, options: { ts?: boolean;
  script?: boolean; } = {}): ParsedFunction => {
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

  return {
    sourceCode: captured,
    fn,
  };
};

describe('isInsideFunctionBody', () => {
  it.each([
    {
      label: 'a node nested inside a function',
      code: 'function outer() {\n  return 1;\n}',
      expected: true,
    },
    {
      label: 'a node at the top level, with no enclosing function',
      code: 'const value = 1;',
      expected: false,
    },
    // An arrow is a function too, so a reference inside one counts the same as inside a `function`.
    {
      label: 'a node nested inside an arrow function',
      code: 'const outer = () => {\n  return 1;\n};',
      expected: true,
    },
  ])('is $expected for $label', ({ code, expected }) => {
    const { sourceCode, firstNode } = sourceCodeFrom(code);
    const literal = firstNode('Literal');

    expect(isInsideFunctionBody(sourceCode, literal)).toBe(expected);
  });
});

describe('SAFE_DECLARATION_PARENTS', () => {
  it('lists exactly the statement positions a declaration is legal in', () => {
    const alphabetically = (values: string[]): string[] => {
      return values.toSorted((left, right) => {
        return left.localeCompare(right);
      });
    };

    expect(alphabetically([...SAFE_DECLARATION_PARENTS])).toEqual(alphabetically([
      'BlockStatement',
      'ExportNamedDeclaration',
      'Program',
      'StaticBlock',
      'SwitchCase',
      'TSModuleBlock',
    ]));
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
    // Crockford's spelling wraps the call rather than the function, so the token right after it
    // is the call's own opening paren, not a wrapping group's closing paren.
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
    // `void` takes the function as a bare operand, where an arrow would need parentheses of its
    // own, so a unary operator is not in the safe-parent list.
    {
      label: 'an operand of a unary operator',
      code: 'void function () {\n  run();\n}();',
      expected: true,
    },
  ])('is $expected for $label', ({ code, expected }) => {
    const { sourceCode, fn } = parseFunction(code);

    expect(sitsInUnsafePosition(sourceCode, fn)).toBe(expected);
  });

  // JSXExpressionContainer needs JSX parsing this file has no reason to carry; index.test.ts
  // covers it through tsxRuleTester.
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

      expect(sitsInUnsafePosition(sourceCode, fn)).toBe(false);
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
    // `super` is only legal inside a method, so the fixture has to be one.
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
    // `new` alone is not `new.target`; matching the keyword alone would wrongly decline every constructor call.
    {
      label: 'a function that only constructs something, with no new.target in sight',
      code: 'function build() {\n  return new Service();\n}',
      expected: true,
    },
    // A sloppy-mode function may repeat a parameter name, which an arrow cannot in any mode; a module is always
    // strict, where the duplicate is already a parse error, so this needs sourceType: 'script' to exist.
    {
      label: 'a duplicate parameter name in a sloppy-mode function',
      code: 'function pick(first, second, first) {\n  return first;\n}',
      options: { script: true },
      expected: false,
    },
    // An explicit `this` parameter is TypeScript-only syntax, so this drives the check through
    // the TypeScript parser rather than through `@mocks/sourceCodeFrom`.
    {
      label: 'an explicit this parameter',
      code: 'function greet(this: Service): string {\n  return "x";\n}',
      options: { ts: true },
      expected: false,
    },
    // Only `asserts x is T` needs a declaration; a plain type predicate is not an assertion
    // signature and does not block the rewrite.
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

    expect(isSafeToConvert(sourceCode, fn, new WeakSet())).toBe(expected);
  });

  // Depends on the caller-built containsThis set, not on the function's own shape, unlike every case above.
  it('is false when the function is recorded as reading this', () => {
    const { sourceCode, fn } = parseFunction('function greet() {\n  return 1;\n}');
    const containsThis = new WeakSet<FunctionLike>();

    containsThis.add(fn);

    expect(isSafeToConvert(sourceCode, fn, containsThis)).toBe(false);
  });
});
