import {
  mustFind,
  type Ranged,
  type TypedNode,
} from '../../../utils/ruleUtils.ts';

// One part of a tag name: `React` or `Fragment` in `<React.Fragment>`. A deeper member has no `name` of its own.
interface JsxNamePart {
  type: string;
  name?: string;
}

// `<React.Fragment>`'s tag name. `Ranged` because the fix replaces it in place rather than rebuilding the tag.
export interface JsxTagName extends Ranged {
  type: string;
  object?: JsxNamePart;
  property?: JsxNamePart;
}

interface JsxTag {
  name?: JsxTagName;
}

// A JSX element, read for both of its tag names. Both, because they have to be rewritten together: a pass that left
// `<Fragment>` against `</React.Fragment>` would not parse, and ESLint writes what the last pass produced.
export interface JsxElementNode {
  // Required: the guard below is what says a node carrying the key is an element, and an element always has one.
  openingElement: JsxTag;
  closingElement?: JsxTag;
}

const isJsxElement = (node: TypedNode): node is TypedNode & JsxElementNode => {
  return 'openingElement' in node;
};

// The tag names reaching `<React.X>`, opening and closing, or nothing where the element is not one. A self-closing
// element has no closing tag, which is why this answers a list rather than a pair.
export const globalNamespaceTags = (node: TypedNode, namespace: string): JsxTagName[] => {
  if (!isJsxElement(node)) {
    return [];
  }

  // An opening element always has a name, and one whose `object` is the namespace is a member expression, whose
  // property is an identifier and so always named.
  const name = mustFind(node.openingElement.name, 'the name of a JSX opening element');

  if (name.object?.name !== namespace) {
    return [];
  }

  const closing = node.closingElement?.name;

  return closing === undefined ? [name] : [name, closing];
};
