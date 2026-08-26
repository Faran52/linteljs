import { createRule } from '../../types.ts';
import {
  ancestorReaderOf,
  ancestorsOf,
  scopeOf,
} from '../../utils/compatUtils.ts';
import { isAwaitedOrAsyncReturn } from '../../utils/promiseChainUtils.ts';
import { optionsOf, type RuleNode } from '../../utils/ruleUtils.ts';

interface PreferAwaitToThenOptions {
  strict: boolean;
}

type MemberExpressionNode = Extract<RuleNode, { type: 'MemberExpression' }>;

const PROMISE_METHODS = new Set([
  'then',
  'catch',
  'finally',
]);

export const preferAwaitToThen = createRule('prefer-await-to-then', {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'promises',
      language: 'universal',
      recommended: true,
      description: 'Prefer `await` to `.then()`, `.catch()`, and `.finally()` when reading Promise values.',
    },
    messages: {
      preferAwait: 'Prefer await to then()/catch()/finally().',
    },
    schema: [
      {
        type: 'object',
        properties: {
          strict: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const strict = optionsOf<PreferAwaitToThenOptions>(context).strict ?? false;

    const isInsideYieldOrAwait = (node: RuleNode): boolean => {
      return ancestorsOf(context, node).some(
        (parent) => {
          return parent.type === 'AwaitExpression' || parent.type === 'YieldExpression';
        },
      );
    };

    const isInsideConstructor = (node: RuleNode): boolean => {
      return ancestorsOf(context, node).some(
        (parent) => {
          return parent.type === 'MethodDefinition' && parent.kind === 'constructor';
        },
      );
    };

    const isTopLevelScoped = (node: RuleNode): boolean => {
      return scopeOf(context, node).block.type === 'Program';
    };

    return {
      // The selector only matches a MemberExpression, so the parameter states that once, not reasserted below.
      'CallExpression > MemberExpression.callee': (node: MemberExpressionNode) => {
        // Hands off to prefer-try-catch once the value is awaited or returned; without this both rules fire.
        const handedOff = !strict && (
          isInsideYieldOrAwait(node)
          || isInsideConstructor(node)
          || isAwaitedOrAsyncReturn(ancestorReaderOf(context), node)
        );

        if (isTopLevelScoped(node) || handedOff) {
          return;
        }

        // `computed` matters: in `promise[then](parse)` the property is a variable, not a call to `.then`.
        if (
          !node.computed
          && node.property.type === 'Identifier'
          && PROMISE_METHODS.has(node.property.name)
        ) {
          context.report({
            node: node.property,
            messageId: 'preferAwait',
          });
        }
      },
    };
  },
});
