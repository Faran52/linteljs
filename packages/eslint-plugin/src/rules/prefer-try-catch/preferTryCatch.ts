import { ancestorReaderOf } from '../../utils/compatUtils.ts';
import { isAwaitedOrAsyncReturn } from '../../utils/promiseChainUtils.ts';
import { createRule } from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

export const preferTryCatch = createRule('prefer-try-catch', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      recommended: true,
      description: 'Prefer `try`/`catch` around an awaited rejection path instead of a promise callback.',
    },
    messages: {
      preferTryCatchOverCatch:
        'Wrap the await in `try`/`catch` instead of handling the rejection with `.catch()`.',
      preferTryCatchOverThenHandler:
        'Wrap the await in `try`/`catch` instead of passing a rejection handler to `then`.',
    },
    schema: [],
  },
  create: (context) => {
    const visitors: Rule.RuleListener = {
      CallExpression: (node) => {
        const { callee } = node;

        // A computed property is a variable, so `promise[then]()` is not a `.then` call.
        if (callee.type !== 'MemberExpression' || callee.computed
          || callee.property.type !== 'Identifier') {
          return;
        }

        const { name } = callee.property;

        // A plain `then(onFulfilled)` is `prefer-await-to-then`'s job.
        const handlesRejection = name === 'catch' && node.arguments.length > 0;
        const passesRejectionHandler = name === 'then' && node.arguments.length > 1;

        let messageId: 'preferTryCatchOverCatch' | 'preferTryCatchOverThenHandler' | null = null;

        if (handlesRejection) {
          messageId = 'preferTryCatchOverCatch';
        }
        else if (passesRejectionHandler) {
          messageId = 'preferTryCatchOverThenHandler';
        }

        // A detached `queue.catch(report)` is fire and forget, so rewriting it would change behaviour.
        if (!messageId) {
          return;
        }

        const ancestorReader = ancestorReaderOf(context);

        if (!isAwaitedOrAsyncReturn(ancestorReader, node)) {
          return;
        }

        context.report({
          node: callee.property,
          messageId,
        });
      },
    };

    return visitors;
  },
});
