import { createRule } from '../../types.ts';

import type { RuleNode } from '../../utils/ruleUtils.ts';

// JSX is not in ESLint's ESTree types, so the listener's `any` is narrowed to the two fields this rule reads.
interface Position {
  line: number;
  column: number;
}

interface JsxAttribute {
  type: 'JSXAttribute';
  name:
    | {
      type: 'JSXIdentifier';
      name: string;
    }
    | {
      type: 'JSXNamespacedName';
      namespace: { name: string };
      name: { name: string };
    };
  loc: {
    start: Position;
    end: Position;
  };
}

interface JsxSpreadAttribute {
  type: 'JSXSpreadAttribute';
}

interface JsxOpeningElement {
  attributes: (JsxAttribute | JsxSpreadAttribute)[];
}

// The one property every ESLint node carries, and all this rule asks for before it narrows. Narrower than `RuleNode`
// on purpose, so a test can hand this a two-field object instead of assembling a whole parsed node.
interface TypedNode {
  type: string;
}

const isOpeningElement = (node: TypedNode): node is TypedNode & JsxOpeningElement => {
  return 'attributes' in node && Array.isArray(node.attributes);
};

// An empty list rather than a visitor guard: a lint run never hands over anything else, so only a direct call reaches
// it.
export const attributesOf = (node: TypedNode): (JsxAttribute | JsxSpreadAttribute)[] => {
  return isOpeningElement(node) ? node.attributes : [];
};

// The full text, so a namespaced name compares whole: `xlink:href` never matches plain `href`,
// and `xlink:href` matches only itself.
const nameOf = (attribute: JsxAttribute): string => {
  if (attribute.name.type === 'JSXNamespacedName') {
    return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
  }

  return attribute.name.name;
};

export const noDuplicateJsxProps = createRule('no-duplicate-jsx-props', {
  meta: {
    type: 'problem',
    docs: {
      category: 'functions',
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
              loc: attribute.loc,
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
