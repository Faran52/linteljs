import {
  createRule,
  optionsOf,
  type RuleNode,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import { isAwaitedOrAsyncReturn } from './utils/promiseChainUtils.ts';

import type { Rule } from 'eslint';

interface Kinded {
  kind?: string;
}

interface PreferAsyncAwaitOptions {
  strict: boolean;
}

const PROMISE_METHODS = new Set([
  'then',
  'catch',
  'finally',
]);

export const preferAsyncAwait = createRule('prefer-async-await', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      recommended: true,
      description: 'Prefer `await` to `.then()`/`.catch()`/`.finally()`, and `try`/`catch` to a rejection handler.',
    },
    messages: {
      preferAwait: 'Prefer await to then()/catch()/finally().',
      preferTryCatch: 'Wrap the await in `try`/`catch` instead of passing a rejection handler.',
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
    const { sourceCode } = context;
    const strict = optionsOf<PreferAsyncAwaitOptions>(context).strict ?? false;

    const isInsideYieldOrAwait = (node: RuleNode): boolean => {
      return sourceCode
        .getAncestors(node)
        .some(
          (parent) => {
            return parent.type === 'AwaitExpression' || parent.type === 'YieldExpression';
          },
        );
    };

    const isInsideConstructor = (node: RuleNode): boolean => {
      return sourceCode
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
      return sourceCode.getScope(node).variableScope.block.type === 'Program';
    };

    const visitors: Rule.RuleListener = {
      CallExpression: (node) => {
        const { callee } = node;

        // In `promise[then](parse)` the property is a variable, not a call to `.then`.
        if (
          callee.type !== 'MemberExpression'
          || callee.computed
          || callee.property.type !== 'Identifier'
          || !PROMISE_METHODS.has(callee.property.name)
        ) {
          return;
        }

        const { name } = callee.property;
        const awaited = isAwaitedOrAsyncReturn(sourceCode, node);
        const passesRejectionHandler = (name === 'catch' && node.arguments.length > 0)
          || (name === 'then' && node.arguments.length > 1);

        // A detached `queue.catch(report)` is fire and forget, so try/catch would change behaviour.
        if (awaited && passesRejectionHandler) {
          context.report({
            node: callee.property,
            messageId: 'preferTryCatch',
          });

          return;
        }

        // Once the value is awaited or returned, only the rejection path is left to report.
        const handedOff = !strict && (awaited || isInsideYieldOrAwait(node) || isInsideConstructor(node));

        if (isTopLevelScoped(node) || handedOff) {
          return;
        }

        context.report({
          node: callee.property,
          messageId: 'preferAwait',
        });
      },
    };

    return visitors;
  },
});
