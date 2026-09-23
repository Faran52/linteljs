import {
  type Ancestor,
  type AncestorReader,
  FUNCTION_TYPES,
  mustFind,
  type RuleNode,
} from './ruleUtils.ts';

// Both callers already know the node is a function; the `in` check here narrows the union, not answers a real question.
const isAsyncFunction = (node: Ancestor | RuleNode): boolean => {
  return 'async' in node && node.async === true;
};

// Climbs to the end of a fluent chain: `fetch(url)` in `fetch(url).then(parse).catch(handle)` answers for it all.
export const outermostCall = (node: RuleNode): RuleNode => {
  let current = node.type === 'MemberExpression'
    && node.parent.type === 'CallExpression'
    && node.parent.callee === node
    ? node.parent
    : node;

  // Every link of a chain is an expression inside some statement, so each has a parent; only Program has none.
  let parent = mustFind(current.parent);

  while (
    parent.type === 'MemberExpression'
    && parent.object === current
    && parent.parent.type === 'CallExpression'
    && parent.parent.callee === parent
  ) {
    current = parent.parent;
    parent = mustFind(current.parent);
  }

  // An optional chain is wrapped in a ChainExpression, so the await or return sits above that wrapper, not the call.
  return parent.type === 'ChainExpression' ? parent : current;
};

// Whether the value is awaited or returned from an async function; shared by prefer-await-to-then
// and prefer-try-catch so neither double-reports a line.
export const isAwaitedOrAsyncReturn = (reader: AncestorReader, node: RuleNode): boolean => {
  const outer = outermostCall(node);
  const parent = mustFind(outer.parent);

  if (parent.type === 'AwaitExpression') {
    return true;
  }

  // An implicit return like async () => promise.catch(handle): the value must be the arrow's body itself.
  if (parent.type === 'ArrowFunctionExpression') {
    return parent.body === outer && isAsyncFunction(parent);
  }

  if (parent.type === 'ReturnStatement') {
    // Innermost enclosing function: reversed and found rather than findLast, newer than this package's Node floor.
    const enclosing = [...reader.getAncestors(node)].reverse().find((ancestor) => {
      return FUNCTION_TYPES.has(ancestor.type);
    });

    return enclosing !== undefined && isAsyncFunction(enclosing);
  }

  return false;
};
