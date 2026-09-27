import { scopeOf } from '../../utils/compatUtils.ts';
import { createRule, resolveVariable } from '../../utils/ruleUtils.ts';

export const noImportNamespaceDestructure = createRule('no-import-namespace-destructure', {
  meta: {
    type: 'suggestion',
    docs: {
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
