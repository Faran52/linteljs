import { declaredVariablesOf } from '../../utils/compatUtils.ts';
import {
  createRule,
  type FunctionNode,
  type MemberExpressionNode,
  mustFind,
  type NamedNode,
  type Ranged,
  rangeOf,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

interface Identified {
  id?: NamedNode | null;
}

type FunctionLike = FunctionNode & Identified;

type Parent = FunctionLike['parent'];

interface Called {
  arguments: Ranged[];
}

// A pattern or an anonymous declaration has no name, so it reads as no component.
const nameOf = (node: (TypedNode & Partial<NamedNode>) | null | undefined): string => {
  return node?.name ?? '';
};

// By identity: ESLint links `parent` on the same objects the call's `arguments` hold.
const isArgumentOf = (call: Called, node: Ranged): boolean => {
  return call.arguments.includes(node);
};

const unwrappedParentOf = (wrapped: Ranged, parent: Parent): Parent => {
  return parent.type === 'CallExpression' && isArgumentOf(parent, wrapped)
    ? unwrappedParentOf(parent, parent.parent)
    : parent;
};

const bindingNameOf = (fn: FunctionLike): string => {
  const parent = unwrappedParentOf(fn, fn.parent);

  if (parent.type === 'VariableDeclarator') {
    return nameOf(parent.id);
  }

  return fn.type === 'FunctionDeclaration' ? nameOf(fn.id) : '';
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
    // A scope reference's identifier is typed without `parent`, so reading it back would take a cast.
    const memberObjects = new Map<string, boolean>();

    return {
      'MemberExpression': (node: MemberExpressionNode) => {
        memberObjects.set(spanOf(node.object), !node.computed || node.property.type === 'Literal');
      },

      ':function:exit': (node: FunctionLike) => {
        const bindingName = bindingNameOf(node);

        if (!/^[A-Z]/.test(bindingName)) {
          return;
        }

        const [firstParam] = node.params;

        if (firstParam?.type !== 'Identifier') {
          return;
        }

        const declared = declaredVariablesOf(context, node)
          .find((variable) => {
            return variable.name === firstParam.name;
          });

        const propsVariable = mustFind(declared);

        const { references } = propsVariable;

        if (references.length === 0) {
          return;
        }

        if (references
          .some((reference) => {
            const span = spanOf(reference.identifier);

            return memberObjects.get(span) !== true;
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
