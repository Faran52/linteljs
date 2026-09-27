import {
  attributesOf,
  elementNameOf,
  type JsxAttribute,
} from '../../utils/jsxUtils.ts';
import {
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

// The full text, so `xlink:href` never matches plain `href`.
const nameOf = ({ name }: JsxAttribute): string => {
  return name.namespace ? `${elementNameOf(name.namespace)}:${elementNameOf(name)}` : elementNameOf(name);
};

export const noDuplicateJsxProps = createRule('no-duplicate-jsx-props', {
  meta: {
    type: 'problem',
    docs: {
      language: 'universal',
      recommended: false,
      description: 'Report duplicate JSX props on the same element.',
    },
    messages: {
      duplicateProp:
        'The {{name}} prop is already on this element; React keeps the last occurrence silently.',
    },
    schema: [],
  },
  create: (context) => {
    return {
      // An untyped selector's parameter must be a supertype of every visitor shape.
      JSXOpeningElement: (node: RuleNode) => {
        const seen = new Set<string>();

        for (const attribute of attributesOf(node)) {
          // An explicit name on either side of a spread is the documented override idiom.
          if (attribute.type === 'JSXSpreadAttribute') {
            seen.clear();
            continue;
          }

          const name = nameOf(attribute);

          if (seen.has(name)) {
            // `loc` rather than `node`: the descriptor's `node` is typed ESTree, which a JSX attribute is not.
            context.report({
              loc: mustFind(attribute.loc, 'the location of a JSX attribute'),
              messageId: 'duplicateProp',
              data: { name },
            });
          }

          seen.add(name);
        }
      },
    };
  },
});
