import {
  mustFind,
  type Ranged,
  type TypedNode,
} from '../../../utils/ruleUtils.ts';

interface JsxNamePart {
  type: string;
  name?: string;
}

export interface JsxTagName extends Ranged {
  type: string;
  object?: JsxNamePart;
  property?: JsxNamePart;
}

interface JsxTag {
  name?: JsxTagName;
}

// A pass that left `<Fragment>` against `</React.Fragment>` would not parse.
export interface JsxElementNode {
  // Required: the guard below is what says a node carrying the key is an element.
  openingElement: JsxTag;
  closingElement?: JsxTag;
}

const isJsxElement = (node: TypedNode): node is TypedNode & JsxElementNode => {
  return 'openingElement' in node;
};

// A self-closing element has no closing tag, hence a list rather than a pair.
export const globalNamespaceTags = (node: TypedNode, namespace: string): JsxTagName[] => {
  if (!isJsxElement(node)) {
    return [];
  }

  // A member-expression name's property is an identifier, and so always named.
  const name = mustFind(node.openingElement.name, 'the name of a JSX opening element');

  if (name.object?.name !== namespace) {
    return [];
  }

  const closing = node.closingElement?.name;

  return closing === undefined ? [name] : [name, closing];
};
