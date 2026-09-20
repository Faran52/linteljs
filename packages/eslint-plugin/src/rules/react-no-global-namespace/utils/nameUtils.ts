import { type NamedNode, type TypedNode } from '../../../utils/ruleUtils.ts';

const isNamed = (node: TypedNode): node is TypedNode & NamedNode => {
  return 'name' in node;
};

/**
 * The name a member property carries. Both shapes a non-computed property can take, `Identifier` and
 * `PrivateIdentifier`, carry one, so through a rule this never answers `undefined`. ESLint types the property as
 * `Expression | PrivateIdentifier` all the same, and the declining arm is reachable only by calling this directly,
 * which is what its own suite does. `jsxUtils.ts` is shaped the same way for the same reason.
 */
export const nameOf = (node: TypedNode): string | undefined => {
  return isNamed(node) ? node.name : undefined;
};
