import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { isAwaitedOrAsyncReturn, outermostCall } from './promiseChainUtils.ts';

// Shapes that look climbable but are not; none of these can reach the walk through either rule,
// which is why they're fixtures here.
const STOPS_WHERE_IT_IS: [string, string, string][] = [
  // A member expression in callee position with no call around it: the one shape where the
  // parent owns a callee and still is not a call.
  ['a `new` callee', 'new promise.Thing();\n', 'MemberExpression'],
  // Passed along rather than called, so the surrounding call is not its call.
  ['a member expression given as an argument', 'register(promise.then);\n', 'MemberExpression'],
  // The inner call is the outer one's callee, not a link before it.
  ['a call whose result is immediately invoked', 'getHandler()(arg);\n', 'CallExpression'],
  // The member is built on `handlers`, not on the call in its property slot.
  ['a call in a computed property', 'handlers[getKey()]();\n', 'CallExpression'],
  // A member chain the node really is part of, ending in a construction.
  ['a member chain that ends in `new`', 'new promise.then.Thing();\n', 'MemberExpression'],
  // A complete member chain that the surrounding call only passes along.
  ['a chain the surrounding call passes along', 'new Wrapper(register(fetch().then));\n', 'CallExpression'],
];

describe('outermostCall', () => {
  it('climbs to the end of a fluent chain', () => {
    const parsed = sourceCodeFrom('fetch(url).then(parse).catch(handle);\n');

    // Document order runs outermost first, so the outer .catch() call comes from firstNode and
    // fetch(url) from lastNode.
    expect(outermostCall(parsed.lastNode('CallExpression')))
      .toBe(parsed.firstNode('CallExpression'));
  });

  // The two rules match different selectors: one arrives holding the call, the other its callee;
  // both must get the same answer.
  it('normalises a callee member expression to its own call', () => {
    const parsed = sourceCodeFrom('promise.catch(handle);\n');

    expect(outermostCall(parsed.firstNode('MemberExpression')))
      .toBe(parsed.firstNode('CallExpression'));
  });

  it.each(STOPS_WHERE_IT_IS)('leaves %s where it is', (_label, code, type) => {
    // The innermost node of its type: document order runs outermost first, and every fixture here
    // nests the interesting node.
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

  // A parameter default runs when the arrow is called and its rejection goes nowhere; the arrow
  // being async says nothing about it.
  it('reports false for a call in an async arrow parameter default', () => {
    expect(answerFor('const run = async (fallback = queue.catch(report)) => fallback;\n')).toBe(false);
  });

  it('reports true for a return from an async function', () => {
    expect(answerFor('async function run() {\n  return queue.catch(log);\n}\n')).toBe(true);
  });

  it('reports false for a return from a plain function', () => {
    expect(answerFor('function run() {\n  return queue.catch(log);\n}\n')).toBe(false);
  });

  // The nearest enclosing function decides, not the outermost, so a plain callback inside an
  // async function still answers false.
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
