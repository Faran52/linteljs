import {
  createRule,
  mustFind,
  type NamedNode,
  optionsOf,
  rebuildLosesComments,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import type { Rule } from 'eslint';

interface SortHookDepsOptions {
  order: 'asc' | 'desc';
  hooks: string[];
}

// Matching is by call name only, so a project with its own hooks replaces this list.
const DEFAULT_HOOKS = [
  'useEffect',
  'useCallback',
  'useMemo',
];

// Generic, so `every` narrows the whole list.
const isPlainIdentifier = <Element extends TypedNode | null>(element: Element): element is Element & NamedNode => {
  return element?.type === 'Identifier';
};

export const sortHookDependencies = createRule('sort-hook-dependencies', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      // Off by default: it matches on bare call names.
      recommended: false,
      fixShape: 'reorder',
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
    const { sourceCode } = context;
    const options = optionsOf<SortHookDepsOptions>(context);
    const order = options.order ?? 'asc';
    const direction = order === 'asc' ? 1 : -1;
    // Widened so a callee with no name, such as `React.useEffect`, is simply not a member.
    const hooks = new Set<string | undefined>(options.hooks ?? DEFAULT_HOOKS);

    const visitors: Rule.RuleListener = {
      CallExpression: (node) => {
        const callee: TypedNode & Partial<NamedNode> = node.callee;

        if (!hooks.has(callee.name)) {
          return;
        }

        const lastArg = node.arguments.at(-1);

        if (lastArg?.type !== 'ArrayExpression') {
          return;
        }

        const { elements } = lastArg;

        // Reordering a member expression or a call could move side effects.
        if (!elements.every(isPlainIdentifier)) {
          return;
        }

        const names = elements
          .map((element) => {
            return element.name;
          });
        const sorted = [...names]
          .sort(
            (a, b) => {
              return direction * a.localeCompare(b, 'en', { numeric: true });
            },
          );

        const isSorted = names
          .every((name, index) => {
            return name === sorted[index];
          });

        if (isSorted) {
          return;
        }

        context.report({
          messageId: 'sort',
          node: lastArg,
          fix: (fixer) => {
            if (rebuildLosesComments(sourceCode, lastArg)) {
              return null;
            }

            // Name by name, so a trailing comma and the line breaks survive.
            return sorted
              .map((name, index) => {
                const element = mustFind(elements[index]);

                return fixer.replaceText(element, name);
              });
          },
        });
      },
    };

    return visitors;
  },
});
