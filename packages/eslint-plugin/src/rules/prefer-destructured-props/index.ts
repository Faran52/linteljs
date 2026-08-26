import { createRule } from '../../types.ts';
import { declaredVariablesOf } from '../../utils/compatUtils.ts';
import {
  type Ranged,
  rangeOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

interface FunctionName {
  name: string;
}

// Read off the union, not a narrowed arm, so the null `export default function () {}` carries survives.
type FunctionLike = Extract<
  RuleNode,
  { type: 'ArrowFunctionExpression' | 'FunctionDeclaration' | 'FunctionExpression' }
> & {
  id?: FunctionName | null;
};

type MemberExpressionNode = Extract<RuleNode, { type: 'MemberExpression' }>;

const declarationNameOf = (fn: FunctionLike): string => {
  return fn.id?.name ?? '';
};

const sameRange = (left: Ranged, right: Ranged): boolean => {
  return rangeOf(left)[0] === rangeOf(right)[0] && rangeOf(left)[1] === rangeOf(right)[1];
};

const isArgumentOf = (call: { arguments: Ranged[] }, node: Ranged): boolean => {
  return call.arguments.some((argument) => {
    return sameRange(argument, node);
  });
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
      category: 'functions',
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
    // Record member objects during traversal: old ESLint cannot read a reference's parent.
    const memberObjects = new Map<string, boolean>();

    return {
      'MemberExpression': (node: MemberExpressionNode) => {
        memberObjects.set(spanOf(node.object), !node.computed || node.property.type === 'Literal');
      },

      // Visit after members have been recorded.
      ':function:exit': (node: FunctionLike) => {
        if (!/^[A-Z]/.test(bindingNameOf(node))) {
          return;
        }

        const [firstParam] = node.params;

        if (firstParam?.type !== 'Identifier') {
          return;
        }

        const propsVariable = declaredVariablesOf(context, node).find((variable) => {
          return variable.name === firstParam.name;
        });

        /* v8 ignore next 3 -- a parameter always declares its own binding */
        if (!propsVariable) {
          return;
        }

        const { references } = propsVariable;

        if (references.length === 0) {
          return;
        }

        // A whole-value use means the object itself is needed.
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
