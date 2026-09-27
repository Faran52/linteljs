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

// The full text, so a namespaced name compares whole: `xlink:href` never matches plain `href`,
// and `xlink:href` matches only itself.
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
      // `RuleNode`, not the JSX shape: an untyped selector's parameter must be a supertype of every visitor shape.
      JSXOpeningElement: (node: RuleNode) => {
        const seen = new Set<string>();

        for (const attribute of attributesOf(node)) {
          // A spread can override every prop before it and be overridden by every prop after it,
          // so an explicit name on either side of one is the documented override idiom, not a repeat.
          if (attribute.type === 'JSXSpreadAttribute') {
            seen.clear();
            continue;
          }

          const name = nameOf(attribute);

          if (seen.has(name)) {
            // `loc` rather than `node`: the descriptor's `node` is typed as an ESTree node, which a JSX attribute
            // is not, and the alternative is a cast this package does not allow.
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
