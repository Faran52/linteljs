import { createRule, resolveVariable } from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

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
    const visitors: Rule.RuleListener = {
      VariableDeclarator: (node) => {
        const { init } = node;

        if (node.id.type !== 'ObjectPattern' || init?.type !== 'Identifier') {
          return;
        }

        const variable = resolveVariable(context.sourceCode.getScope(node), init.name);

        // Not the declaration's specifiers, which would also match the default in `import def, * as ns from 'mod'`.
        if (variable?.defs[0]?.node.type === 'ImportNamespaceSpecifier') {
          context.report({
            messageId: 'noDestructureNamespace',
            node,
          });
        }
      },
    };

    return visitors;
  },
});
