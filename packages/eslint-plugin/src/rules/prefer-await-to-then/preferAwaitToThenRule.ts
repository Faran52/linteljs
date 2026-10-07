import { isAwaitedOrAsyncReturn } from '../../utils/promiseChainUtils.ts';
import {
  createRule,
  type MemberExpressionNode,
  optionsOf,
  type RuleNode,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface Kinded {
  kind?: string;
}

interface PreferAwaitToThenOptions {
  strict: boolean;
}

const PROMISE_METHODS = new Set([
  'then',
  'catch',
  'finally',
]);

export const preferAwaitToThen = createRule('prefer-await-to-then', {
  meta: {
    type: 'suggestion',
    docs: {
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
      return context.sourceCode
        .getAncestors(node)
        .some(
          (parent) => {
            return parent.type === 'AwaitExpression' || parent.type === 'YieldExpression';
          },
        );
    };

    const isInsideConstructor = (node: RuleNode): boolean => {
      return context.sourceCode
        .getAncestors(node)
        .some(
          // Only a MethodDefinition carries this kind, so no type test is needed first.
          (parent: TypedNode & Kinded) => {
            return parent.kind === 'constructor';
          },
        );
    };

    // The function scope, so a block at the top level of the file counts as top level.
    const isTopLevelScoped = (node: RuleNode): boolean => {
      return context.sourceCode.getScope(node).variableScope.block.type === 'Program';
    };

    const visitors: Rule.RuleListener = {
      'CallExpression > MemberExpression.callee': (node: MemberExpressionNode) => {
        // Hands off to prefer-try-catch once the value is awaited or returned; without this both rules fire.
        const handedOff = !strict && (
          isInsideYieldOrAwait(node)
          || isInsideConstructor(node)
          || isAwaitedOrAsyncReturn(context.sourceCode, node)
        );

        if (isTopLevelScoped(node) || handedOff) {
          return;
        }

        // In `promise[then](parse)` the property is a variable, not a call to `.then`.
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

    return visitors;
  },
});
