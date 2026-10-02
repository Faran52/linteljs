import {
  createRule,
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

interface NameBeforeUseOptions {
  ignoreEmptyLiterals: boolean;
  ignoreLiteralArguments: boolean;
}

interface CallMatch {
  type: 'CallExpression' | 'NewExpression';
}

interface LiteralMatch {
  type: 'ArrayExpression' | 'ObjectExpression';
}

type CallNode = Extract<RuleNode, CallMatch>;

type LiteralNode = Extract<RuleNode, LiteralMatch>;

type PassesPosition = (parent: RuleNode, child: RuleNode) => boolean;

// Wrappers that pass a value through unused, so the value stands where the wrapper does.
const TRANSPARENT_TYPES = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
]);

// None of these can hold the value on its left, so holding it at all means holding it on the right. An await is
// judged itself, so what it waits on is not judged again.
const NAMING_TYPES = new Set([
  'AssignmentExpression',
  'AssignmentPattern',
  'AwaitExpression',
  'ExportDefaultDeclaration',
  'ExpressionStatement',
  'VariableDeclarator',
]);

const CALL_TYPES = new Set(['CallExpression', 'NewExpression']);

const LITERAL_TYPES = new Set(['ArrayExpression', 'ObjectExpression']);

const isWrapper = (parent: RuleNode): boolean => {
  return TRANSPARENT_TYPES.has(parent.type);
};

// A ternary's branches and the right side of `&&`, `||` and `??` stand where the whole expression does. The test
// and the left side are conditions.
const isBranch: PassesPosition = (parent, child) => {
  if (parent.type === 'ConditionalExpression') {
    return !Object.is(parent.test, child);
  }

  if (parent.type === 'LogicalExpression') {
    return Object.is(parent.right, child);
  }

  return isWrapper(parent);
};

// The first parent that does not pass the position through, with the node it holds.
const usingParentOf = (node: RuleNode, passesPosition: PassesPosition): [RuleNode, RuleNode] => {
  let child = node;
  let parent = mustFind(node.parent);

  while (passesPosition(parent, child)) {
    child = parent;
    parent = mustFind(child.parent);
  }

  return [child, parent];
};

const standsNamed = (node: RuleNode): boolean => {
  const [child, parent] = usingParentOf(node, isBranch);

  if (parent.type === 'PropertyDefinition') {
    return Object.is(parent.value, child);
  }

  return NAMING_TYPES.has(parent.type);
};

// A spread hands its operand to whatever holds the spread, as in `{ ...(flag ? { alpha } : {}) }`.
const isMember: PassesPosition = (parent, child) => {
  return parent.type === 'SpreadElement' || isBranch(parent, child);
};

// A literal nested in a literal is part of the outer one's value, judged once there.
const isInsideLiteral = (node: RuleNode): boolean => {
  const [child, parent] = usingParentOf(node, isMember);

  if (parent.type === 'Property') {
    return Object.is(parent.value, child);
  }

  return LITERAL_TYPES.has(parent.type);
};

const isEmptyLiteral = (node: LiteralNode): boolean => {
  const members = node.type === 'ArrayExpression' ? node.elements : node.properties;

  return members.length === 0;
};

// A literal is never a callee, so a call holding one holds it as an argument. Only one passed straight counts.
const isCallArgument = (node: RuleNode): boolean => {
  const [, parent] = usingParentOf(node, isWrapper);

  return CALL_TYPES.has(parent.type);
};

export const nameBeforeUse = createRule('name-before-use', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      recommended: false,
      description:
        'Name an await, a call that takes a call, or an inline array or object in a const before using it.',
    },
    messages: {
      nameAwait: 'Name this await in a const first, then use the const here.',
      nameNestedCall: 'Name this call in a const first, then use the const here.',
      nameLiteral: 'Name this literal in a const first, then use the const here.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreEmptyLiterals: {
            type: 'boolean',
            default: false,
          },
          ignoreLiteralArguments: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const options = optionsOf<NameBeforeUseOptions>(context);

    const isIgnoredLiteral = (node: LiteralNode): boolean => {
      const isIgnoredEmpty = options.ignoreEmptyLiterals === true && isEmptyLiteral(node);
      const isIgnoredArgument = options.ignoreLiteralArguments === true && isCallArgument(node);

      return isIgnoredEmpty || isIgnoredArgument;
    };

    const reportLiteral = (node: LiteralNode): void => {
      if (isInsideLiteral(node) || standsNamed(node) || isIgnoredLiteral(node)) {
        return;
      }

      context.report({
        messageId: 'nameLiteral',
        node,
      });
    };

    const reportNestedCall = (node: CallNode): void => {
      const takesCall = node.arguments
        .some((argument) => {
          return CALL_TYPES.has(argument.type);
        });

      if (takesCall && !standsNamed(node)) {
        context.report({
          messageId: 'nameNestedCall',
          node,
        });
      }
    };

    return {
      ArrayExpression: reportLiteral,
      ObjectExpression: reportLiteral,
      CallExpression: reportNestedCall,
      NewExpression: reportNestedCall,
      AwaitExpression: (node) => {
        if (!standsNamed(node)) {
          context.report({
            messageId: 'nameAwait',
            node,
          });
        }
      },
    };
  },
});
