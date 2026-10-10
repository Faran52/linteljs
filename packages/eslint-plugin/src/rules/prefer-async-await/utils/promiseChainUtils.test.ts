import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { isAwaitedOrAsyncReturn, outermostCall } from './promiseChainUtils.ts';

const STOPS_WHERE_IT_IS: [string, string, string][] = [
  [
    'a `new` callee',
    'new promise.Thing();\n',
    'MemberExpression',
  ],
  [
    'a member expression given as an argument',
    'register(promise.then);\n',
    'MemberExpression',
  ],
  [
    'a call whose result is immediately invoked',
    'getHandler()(arg);\n',
    'CallExpression',
  ],
  [
    'a call in a computed property',
    'handlers[getKey()]();\n',
    'CallExpression',
  ],
  [
    'a member chain that ends in `new`',
    'new promise.then.Thing();\n',
    'MemberExpression',
  ],
  [
    'a chain the surrounding call passes along',
    'new Wrapper(register(fetch().then));\n',
    'CallExpression',
  ],
];

const TYPE_WRAPPERS: [string, string][] = [
  ['TSAsExpression', 'await (fetch(url).catch(handle) as Promise<Data>);\n'],
  ['TSNonNullExpression', 'await fetch(url).catch(handle)!;\n'],
  ['TSSatisfiesExpression', 'await (fetch(url).catch(handle) satisfies Promise<Data>);\n'],
  ['TSTypeAssertion', 'await <Promise<Data>>fetch(url).catch(handle);\n'],
];

describe('outermostCall', () => {
  it('climbs to the end of a fluent chain', () => {
    const parsed = sourceCodeFrom('fetch(url).then(parse).catch(handle);\n');

    const actual = outermostCall(parsed.lastNode('CallExpression'));

    expect(actual)
      .toBe(parsed.firstNode('CallExpression'));
  });

  it('normalises a callee member expression to its own call', () => {
    const parsed = sourceCodeFrom('promise.catch(handle);\n');

    const actual = outermostCall(parsed.firstNode('MemberExpression'));

    expect(actual)
      .toBe(parsed.firstNode('CallExpression'));
  });

  it.each(STOPS_WHERE_IT_IS)('leaves %s where it is', (_label, code, type) => {
    const node = sourceCodeFrom(code).lastNode(type);

    const actual = outermostCall(node);
    expect(actual).toBe(node);
  });

  it('answers with the chain wrapper when the chain is optional', () => {
    const parsed = sourceCodeFrom('api?.fetch(url).catch(handle);\n');

    const actual = outermostCall(parsed.firstNode('CallExpression'));

    expect(actual)
      .toBe(parsed.firstNode('ChainExpression'));
  });

  it.each(TYPE_WRAPPERS)('climbs through a %s around the chain', (type, code) => {
    const parsed = sourceCodeFrom(code, tseslint.parser);
    const outer = outermostCall(parsed.lastNode('CallExpression'));

    expect(outer).toBe(parsed.firstNode(type));
  });

  it('climbs on through a type wrapper inside the chain', () => {
    const parsed = sourceCodeFrom('(fetch(url) as Promise<Data>).catch(handle);\n', tseslint.parser);
    const outer = outermostCall(parsed.lastNode('CallExpression'));

    expect(outer).toBe(parsed.firstNode('CallExpression'));
  });

  it('climbs on past a parenthesised optional chain', () => {
    const parsed = sourceCodeFrom('(api?.fetch(url)).catch(handle);\n');
    const outer = outermostCall(parsed.lastNode('CallExpression'));

    expect(outer).toBe(parsed.firstNode('CallExpression'));
  });
});

const answerFor = (code: string, type = 'CallExpression'): boolean => {
  const parsed = sourceCodeFrom(code);

  const node = parsed.lastNode(type);

  return isAwaitedOrAsyncReturn(parsed.sourceCode, node);
};

describe('isAwaitedOrAsyncReturn', () => {
  it.each([
    [
      'reports true for an awaited call',
      'const run = async () => {\n  await queue.catch(log);\n};\n',
      true,
    ],
    [
      'reports false for a call nothing settles',
      'queue.catch(log);\n',
      false,
    ],
    [
      'reports true for an implicit return from an async arrow',
      'const run = async () => queue.catch(log);\n',
      true,
    ],
    [
      'reports false for an implicit return from a plain arrow',
      'const run = () => queue.catch(log);\n',
      false,
    ],
    [
      'reports false for a call in an async arrow parameter default',
      'const run = async (fallback = queue.catch(report)) => fallback;\n',
      false,
    ],
    [
      'reports true for a return from an async function',
      'async function run() {\n  return queue.catch(log);\n}\n',
      true,
    ],
    [
      'reports false for a return from a plain function',
      'function run() {\n  return queue.catch(log);\n}\n',
      false,
    ],
  ])('%s', (_label, code, expected) => {
    const answer = answerFor(code);
    expect(answer).toBe(expected);
  });

  it('reports true for a type-asserted return from an async function', () => {
    const parsed = sourceCodeFrom(
      'async function run() {\n  return queue.catch(log) as Promise<void>;\n}\n',
      tseslint.parser,
    );
    const answer = isAwaitedOrAsyncReturn(parsed.sourceCode, parsed.lastNode('CallExpression'));

    expect(answer).toBe(true);
  });

  it('reads the nearest enclosing function, not the outermost', () => {
    const lines = [
      'async function run() {',
      '  return items.map(function each() {',
      '    return queue.catch(log);',
      '  });',
      '}',
      '',
    ];
    const code = lines.join('\n');

    const answer = answerFor(code, 'MemberExpression');
    expect(answer).toBe(false);
  });
});
