import {
  type Ancestor,
  type AncestorReader,
  FUNCTION_TYPES,
  type MemberExpressionNode,
  mustFind,
  type RuleNode,
} from './ruleUtils.ts';

// The `in` check narrows the union; both callers already know the node is a function.
const isAsyncFunction = (node: Ancestor | RuleNode): boolean => {
  return 'async' in node && node.async === true;
};

// The `.then` of `promise.then(parse)`, whose parent is the call.
const isCalledMember = (node: RuleNode): node is MemberExpressionNode => {
  return node.type === 'MemberExpression'
    && node.parent.type === 'CallExpression'
    && node.parent.callee === node;
};

// An optional chain is wrapped in a ChainExpression, so the await or return sits above it.
const climbChain = (current: RuleNode): RuleNode => {
  // Only Program has no parent.
  const parent = mustFind(current.parent);

  if (isCalledMember(parent) && parent.object === current) {
    return climbChain(parent.parent);
  }

  return parent.type === 'ChainExpression' ? parent : current;
};

export const outermostCall = (node: RuleNode): RuleNode => {
  return climbChain(isCalledMember(node) ? node.parent : node);
};

// Shared by prefer-await-to-then and prefer-try-catch so neither double-reports a line.
export const isAwaitedOrAsyncReturn = (reader: AncestorReader, node: RuleNode): boolean => {
  const outer = outermostCall(node);
  const parent = mustFind(outer.parent);

  if (parent.type === 'AwaitExpression') {
    return true;
  }

  // A call under an arrow can only be its body: every other child is a pattern or annotation.
  if (parent.type === 'ArrowFunctionExpression') {
    return isAsyncFunction(parent);
  }

  if (parent.type === 'ReturnStatement') {
    // Not `findLast`, newer than this package's Node floor.
    const enclosing = [...reader.getAncestors(node)]
      .reverse()
      .find((ancestor) => {
        return FUNCTION_TYPES.has(ancestor.type);
      });

    return enclosing !== undefined && isAsyncFunction(enclosing);
  }

  return false;
};
