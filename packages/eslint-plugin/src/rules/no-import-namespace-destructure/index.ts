import { createRule } from '../../types.ts';
import { scopeOf } from '../../utils/compatUtils.ts';

import type { Scope } from 'eslint';

// Resolves a name against the scope chain, innermost first: the declarator's own scope alone finds nothing once
// the destructure sits inside a function or block, and walking up also gets shadowing right for free.
const resolveVariable = (scope: Scope.Scope, name: string): Scope.Variable | null => {
  for (let current: Scope.Scope | null = scope; current; current = current.upper) {
    const found = current.variables.find((variable) => {
      return variable.name === name;
    });

    if (found) {
      return found;
    }
  }

  return null;
};

export const noImportNamespaceDestructure = createRule('no-import-namespace-destructure', {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'imports',
      language: 'universal',
      recommended: true,
      description:
        'Avoid destructuring namespace imports when a named import is enough.',
    },
    messages: {
      noDestructureNamespace:
        'Do not destructure namespace imports; import only specific members needed.',
    },
    schema: [],
  },
  create: (context) => {
    return {
      VariableDeclarator: (node) => {
        const { init } = node;

        if (node.id.type !== 'ObjectPattern' || init?.type !== 'Identifier') {
          return;
        }

        const variable = resolveVariable(scopeOf(context, node), init.name);

        // The binding's own definition, not its declaration's specifier list: checking the
        // declaration would also match the default in `import def, * as ns from 'mod'`.
        if (variable?.defs[0]?.node.type === 'ImportNamespaceSpecifier') {
          context.report({
            messageId: 'noDestructureNamespace',
            node,
          });
        }
      },
    };
  },
});
