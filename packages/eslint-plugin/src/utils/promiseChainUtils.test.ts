import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
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

describe('outermostCall', () => {
  it('climbs to the end of a fluent chain', () => {
    const parsed = sourceCodeFrom('fetch(url).then(parse).catch(handle);\n');

    expect(outermostCall(parsed.lastNode('CallExpression')))
      .toBe(parsed.firstNode('CallExpression'));
  });

  it('normalises a callee member expression to its own call', () => {
    const parsed = sourceCodeFrom('promise.catch(handle);\n');

    expect(outermostCall(parsed.firstNode('MemberExpression')))
      .toBe(parsed.firstNode('CallExpression'));
  });

  it.each(STOPS_WHERE_IT_IS)('leaves %s where it is', (_label, code, type) => {
    const node = sourceCodeFrom(code).lastNode(type);

    expect(outermostCall(node)).toBe(node);
  });

  it('answers with the chain wrapper when the chain is optional', () => {
    const parsed = sourceCodeFrom('api?.fetch(url).catch(handle);\n');

    expect(outermostCall(parsed.firstNode('CallExpression')))
      .toBe(parsed.firstNode('ChainExpression'));
  });
});

const answerFor = (code: string, type = 'CallExpression'): boolean => {
  const parsed = sourceCodeFrom(code);

  return isAwaitedOrAsyncReturn(parsed.sourceCode, parsed.lastNode(type));
};

describe('isAwaitedOrAsyncReturn', () => {
  it('reports true for an awaited call', () => {
    expect(answerFor('const run = async () => {\n  await queue.catch(log);\n};\n')).toBe(true);
  });

  it('reports false for a call nothing settles', () => {
    expect(answerFor('queue.catch(log);\n')).toBe(false);
  });

  it('reports true for an implicit return from an async arrow', () => {
    expect(answerFor('const run = async () => queue.catch(log);\n')).toBe(true);
  });

  it('reports false for an implicit return from a plain arrow', () => {
    expect(answerFor('const run = () => queue.catch(log);\n')).toBe(false);
  });

  it('reports false for a call in an async arrow parameter default', () => {
    expect(answerFor('const run = async (fallback = queue.catch(report)) => fallback;\n')).toBe(false);
  });

  it('reports true for a return from an async function', () => {
    expect(answerFor('async function run() {\n  return queue.catch(log);\n}\n')).toBe(true);
  });

  it('reports false for a return from a plain function', () => {
    expect(answerFor('function run() {\n  return queue.catch(log);\n}\n')).toBe(false);
  });

  it('reads the nearest enclosing function, not the outermost', () => {
    const code = [
      'async function run() {',
      '  return items.map(function each() {',
      '    return queue.catch(log);',
      '  });',
      '}',
      '',
    ].join('\n');

    expect(answerFor(code, 'MemberExpression')).toBe(false);
  });
});
