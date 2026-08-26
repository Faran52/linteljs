import { createRule } from '../../types.ts';
import { sourceCodeOf } from '../../utils/compatUtils.ts';
import { optionsOf, rebuildLosesComments } from '../../utils/ruleUtils.ts';

interface SortHookDepsOptions {
  order: 'asc' | 'desc';
  hooks: string[];
}

// Matching is by call name only, so a project with its own hooks replaces this list through the `hooks` option.
const DEFAULT_HOOKS = ['useEffect', 'useCallback', 'useMemo'];

// Wider than the `Identifier` these two care about, so both take ESLint's loosest expression union.
const isPlainIdentifier = (element: { type: string }
  | null): boolean => {
  return element?.type === 'Identifier';
};

const nameOf = (element: { type: string }
  | null): string => {
  /* v8 ignore next 2 -- only reached once isPlainIdentifier has cleared every element */
  return element && 'name' in element && typeof element.name === 'string' ? element.name : '';
};

export const sortHookDependencies = createRule('sort-hook-dependencies', {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'ordering',
      language: 'universal',
      // Off by default: matches on bare call names, so opting in should be a decision, not inherited from a preset.
      recommended: false,
      description: 'Keep hook dependency arrays in a consistent order.',
    },
    fixable: 'code',
    messages: {
      sort: 'Dependencies should be sorted alphabetically.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
          },
          hooks: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            uniqueItems: true,
            default: DEFAULT_HOOKS,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const options = optionsOf<SortHookDepsOptions>(context);
    const order = options.order ?? 'asc';
    const direction = order === 'asc' ? 1 : -1;
    const hooks = new Set(options.hooks ?? DEFAULT_HOOKS);

    return {
      CallExpression: (node) => {
        if (node.callee.type !== 'Identifier' || !hooks.has(node.callee.name)) {
          return;
        }

        const lastArg = node.arguments[node.arguments.length - 1];

        if (lastArg?.type !== 'ArrayExpression') {
          return;
        }

        const { elements } = lastArg;

        // Reordering a member expression or a call would move text this rule cannot verify is free of side effects.
        if (!elements.every(isPlainIdentifier)) {
          return;
        }

        const names = elements.map(nameOf);
        const sorted = [...names].sort(
          (a, b) => {
            return direction * a.localeCompare(b, 'en', { numeric: true });
          },
        );

        const isSorted = names.every((name, index) => {
          return name === sorted[index];
        });

        if (isSorted) {
          return;
        }

        context.report({
          messageId: 'sort',
          node: lastArg,
          fix: (fixer) => {
            // A comment on a dependency is not ours to drop.
            if (rebuildLosesComments(sourceCode, lastArg)) {
              return null;
            }

            return fixer.replaceText(lastArg, `[${sorted.join(', ')}]`);
          },
        });
      },
    };
  },
});
