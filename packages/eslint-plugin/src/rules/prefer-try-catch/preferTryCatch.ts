import { createRule } from '../../types.ts';
import { ancestorReaderOf } from '../../utils/compatUtils.ts';
import { isAwaitedOrAsyncReturn } from '../../utils/promiseChainUtils.ts';

export const preferTryCatch = createRule('prefer-try-catch', {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'promises',
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
    return {
      CallExpression: (node) => {
        const { callee } = node;

        // A computed property is a variable, not the method by that name, so `promise[then]()` is not a `.then` call.
        if (callee.type !== 'MemberExpression' || callee.computed
          || callee.property.type !== 'Identifier') {
          return;
        }

        const { name } = callee.property;

        // `then` only counts with a rejection handler; a plain `then(onFulfilled)` is `prefer-await-to-then`'s job.
        const handlesRejection = name === 'catch' && node.arguments.length > 0;
        const passesRejectionHandler = name === 'then' && node.arguments.length > 1;

        let messageId: 'preferTryCatchOverCatch' | 'preferTryCatchOverThenHandler' | null = null;

        if (handlesRejection) {
          messageId = 'preferTryCatchOverCatch';
        }
        else if (passesRejectionHandler) {
          messageId = 'preferTryCatchOverThenHandler';
        }

        // Only flag a rejection a `try`/`catch` could take over: a detached `queue.catch(report)` is fire and forget,
        // so rewriting it would change behaviour; that case belongs to `prefer-await-to-then`.
        if (!messageId || !isAwaitedOrAsyncReturn(ancestorReaderOf(context), node)) {
          return;
        }

        context.report({
          node: callee.property,
          messageId,
        });
      },
    };
  },
});
