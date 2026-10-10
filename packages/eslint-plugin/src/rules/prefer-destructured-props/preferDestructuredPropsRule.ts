import { COMPONENT_WRAPPERS } from '../../constants.ts';
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

import type { Rule } from 'eslint';

interface CallExpressionMatch {
  type: 'CallExpression';
}

type CallExpressionNode = Extract<Rule.Node, CallExpressionMatch>;

interface Identified {
  id?: NamedNode | null;
}

type FunctionLike = FunctionNode & Identified;

type Parent = FunctionLike['parent'];

interface Called {
  arguments: Ranged[];
}

const PASCAL_CASE = /^[A-Z][\dA-Za-z]*$/;

const HOOK_NAME = /^use(?:[A-Z]|$)/;

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

const calleeNameOf = (callee: CallExpressionNode['callee']): string => {
  return callee.type === 'MemberExpression' ? nameOf(callee.property) : nameOf(callee);
};

const isFirstArgumentOf = (call: Called, node: Ranged): boolean => {
  return call.arguments[0] === node;
};

const isWrappedComponent = (fn: FunctionLike): boolean => {
  const { parent } = fn;

  if (parent.type !== 'CallExpression' || !isFirstArgumentOf(parent, fn)) {
    return false;
  }

  const wrapperName = calleeNameOf(parent.callee);

  return COMPONENT_WRAPPERS.has(wrapperName);
};

const spanOf = (node: Ranged): string => {
  const [start, end] = rangeOf(node);

  return `${String(start)}:${String(end)}`;
};

// A write through the object has no destructured equivalent: it would land on a local copy.
const isWriteTarget = (node: MemberExpressionNode): boolean => {
  const { parent } = node;

  switch (parent.type) {
    case 'AssignmentExpression':
    case 'AssignmentPattern':
    case 'ForInStatement':
    case 'ForOfStatement':
      return parent.left === node;
    case 'UnaryExpression':
      return parent.operator === 'delete';
    case 'Property':
      return parent.parent.type === 'ObjectPattern' && parent.value === node;
    default:
      return parent.type === 'ArrayPattern' || parent.type === 'RestElement' || parent.type === 'UpdateExpression';
  }
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
    const open: FunctionLike[] = [];
    const rendering = new Set<FunctionLike>();

    const markRendering = (): void => {
      const current = open.at(-1);

      if (current) {
        rendering.add(current);
      }
    };

    const isComponent = (fn: FunctionLike): boolean => {
      if (isWrappedComponent(fn)) {
        return true;
      }

      const bindingName = bindingNameOf(fn);

      return rendering.has(fn) && PASCAL_CASE.test(bindingName);
    };

    const visitors: Rule.RuleListener = {
      ':function': (node: FunctionLike) => {
        open.push(node);
      },

      'JSXElement, JSXFragment': markRendering,

      'CallExpression': (node: CallExpressionNode) => {
        const calleeName = calleeNameOf(node.callee);

        if (HOOK_NAME.test(calleeName)) {
          markRendering();
        }
      },

      'MemberExpression': (node: MemberExpressionNode) => {
        const destructurable = !node.computed || node.property.type === 'Literal';

        memberObjects.set(spanOf(node.object), destructurable && !isWriteTarget(node));
      },

      ':function:exit': (node: FunctionLike) => {
        open.pop();

        // JSX or a hook in a nested callback renders for the enclosing function too.
        if (rendering.has(node)) {
          markRendering();
        }

        if (!isComponent(node)) {
          return;
        }

        const [firstParam] = node.params;

        if (firstParam?.type !== 'Identifier') {
          return;
        }

        const declared = context.sourceCode
          .getDeclaredVariables(node)
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

    return visitors;
  },
});
