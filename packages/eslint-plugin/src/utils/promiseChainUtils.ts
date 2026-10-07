import { TRANSPARENT_WRAPPER_TYPES } from '../constants.ts';

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

const isCalledMember = (node: RuleNode): node is MemberExpressionNode => {
  return node.type === 'MemberExpression'
    && node.parent.type === 'CallExpression'
    && node.parent.callee === node;
};

const climbChain = (current: RuleNode): RuleNode => {
  // Only Program has no parent.
  const parent = mustFind(current.parent);

  if (TRANSPARENT_WRAPPER_TYPES.has(parent.type)) {
    return climbChain(parent);
  }

  if (isCalledMember(parent) && parent.object === current) {
    return climbChain(parent.parent);
  }

  return current;
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
    const enclosing = reader
      .getAncestors(node)
      .findLast((ancestor) => {
        return FUNCTION_TYPES.has(ancestor.type);
      });

    return enclosing !== undefined && isAsyncFunction(enclosing);
  }

  return false;
};
