import { createRule } from '../../types.ts';
import { declaredVariablesOf } from '../../utils/compatUtils.ts';
import {
  type FunctionNode,
  type MemberExpressionNode,
  mustFind,
  type NamedNode,
  type Ranged,
  rangeOf,
} from '../../utils/ruleUtils.ts';

interface Identified {
  id?: NamedNode | null;
}

type FunctionLike = FunctionNode & Identified;

interface Called {
  arguments: Ranged[];
}

const declarationNameOf = (fn: FunctionLike): string => {
  return fn.id?.name ?? '';
};

// By identity: ESLint links `parent` on the same objects the call's `arguments` hold.
const isArgumentOf = (call: Called, node: Ranged): boolean => {
  return call.arguments.includes(node);
};

const bindingNameOf = (fn: FunctionLike): string => {
  let wrapped: Ranged = fn;
  let { parent } = fn;

  // Climb wrapper arguments to the component's declarator, never wrapper callees.
  while (parent.type === 'CallExpression' && isArgumentOf(parent, wrapped)) {
    wrapped = parent;
    ({ parent } = parent);
  }

  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return parent.id.name;
  }

  return fn.type === 'FunctionDeclaration' ? declarationNameOf(fn) : '';
};

const spanOf = (node: Ranged): string => {
  const [start, end] = rangeOf(node);

  return `${String(start)}:${String(end)}`;
};

export const preferDestructuredProps = createRule('prefer-destructured-props', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      // Uppercase implies a component only in rendering frameworks.
      recommended: false,
      description: 'Destructure component props in the function signature instead of reading them one field at a time.',
    },
    messages: {
      destructure: 'Destructure the props in the signature instead of reading them member by member.',
    },
    schema: [],
  },
  create: (context) => {
    // Record member objects during traversal: a scope reference's identifier is typed without `parent`, so reading
    // it back from there would take a cast.
    const memberObjects = new Map<string, boolean>();

    return {
      'MemberExpression': (node: MemberExpressionNode) => {
        memberObjects.set(spanOf(node.object), !node.computed || node.property.type === 'Literal');
      },

      ':function:exit': (node: FunctionLike) => {
        if (!/^[A-Z]/.test(bindingNameOf(node))) {
          return;
        }

        const [firstParam] = node.params;

        if (firstParam?.type !== 'Identifier') {
          return;
        }

        // A parameter always declares its own binding.
        const propsVariable = mustFind(declaredVariablesOf(context, node).find((variable) => {
          return variable.name === firstParam.name;
        }));

        const { references } = propsVariable;

        if (references.length === 0) {
          return;
        }

        if (references.some((reference) => {
          return memberObjects.get(spanOf(reference.identifier)) !== true;
        })) {
          return;
        }

        context.report({
          messageId: 'destructure',
          node: firstParam,
        });
      },
    };
  },
});
