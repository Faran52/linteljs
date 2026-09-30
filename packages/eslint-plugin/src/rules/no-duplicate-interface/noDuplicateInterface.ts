import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

// The block holding the declaration, seen through an `export`: the Program, a `declare global`,
// `declare module` or `namespace` body, or a function's block.
const scopeOf = (declaration: RuleNode): RuleNode => {
  const parent = mustFind(declaration.parent);

  return parent.type.startsWith('Export') ? mustFind(parent.parent) : parent;
};

export const noDuplicateInterface = createRule('no-duplicate-interface', {
  meta: {
    type: 'problem',
    docs: {
      language: 'typescript',
      recommended: true,
      description: 'Report a second interface of the same name in the same scope.',
    },
    messages: {
      duplicateInterface: 'Merge this into the {{name}} interface above or rename it; TypeScript merges them silently.',
    },
    schema: [],
  },
  // Report-only: merging the two bodies is not provably safe.
  create: (context) => {
    const namesByScope = new Map<RuleNode, Set<string>>();

    return {
      // The name node, which ESTree types; the declaration it hangs off is not.
      'TSInterfaceDeclaration > Identifier.id': (node: RuleNode) => {
        const scope = scopeOf(mustFind(node.parent));
        const names = namesByScope.get(scope) ?? new Set<string>();
        const name = sourceCodeOf(context).getText(node);

        if (names.has(name)) {
          context.report({
            node,
            messageId: 'duplicateInterface',
            data: { name },
          });
        }

        names.add(name);
        namesByScope.set(scope, names);
      },
    };
  },
});
