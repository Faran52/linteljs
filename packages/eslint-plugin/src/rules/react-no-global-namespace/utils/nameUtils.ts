import { type NamedNode, type TypedNode } from '../../../utils/ruleUtils.ts';

const isNamed = (node: TypedNode): node is TypedNode & NamedNode => {
  return 'name' in node;
};

// A non-computed property always carries a name, so only a direct call reaches the declining arm.
export const nameOf = (node: TypedNode): string | undefined => {
  return isNamed(node) ? node.name : undefined;
};
