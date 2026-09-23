import type {
  AST,
  Rule,
  Scope,
} from 'eslint';

export type RuleNode = Rule.Node;

export type Fixer = Rule.RuleFixer;

export type SourceCode = Rule.RuleContext['sourceCode'];

export type RuleContext = Rule.RuleContext;

// `getAncestors` seen through a node ESLint's types won't admit: ESLint 10 added `JSXIdentifier` to a
// reference's identifier, needed so `prefer-arrow-functions` catches `<Foo />` before `const Foo = () => {}`.
export type Ancestor
  = | ReturnType<SourceCode['getAncestors']>[number]
    | Scope.Reference['identifier'];

export interface AncestorReader {
  getAncestors(node: Ancestor): Ancestor[];
}

// Where the parse put something. Taken from ESLint's own token type rather than written out again: a node, a token
// and a comment all carry the same shape, and four rules had described it under six names between them.
export type NodeLocation = AST.Token['loc'];

export type Position = NodeLocation['start'];

// A parsed thing carrying a source range; shaped rather than RuleNode so a test can call rangeOf({}) with no cast.
export interface Ranged {
  range?: AST.Range | undefined;
}

// The one property every node carries, and what a rule reads before it narrows.
export interface TypedNode {
  type: string;
}

// An identifier read for its name: a function's `id`, a type parameter, one part of a JSX name.
export interface NamedNode {
  name: string;
}

// The matchers `Extract` reads. Private, because what a rule wants is the node they pick out, not the shape.
interface ObjectPatternMatch {
  type: 'ObjectPattern';
}

interface ArrayPatternMatch {
  type: 'ArrayPattern';
}

interface MemberExpressionMatch {
  type: 'MemberExpression';
}

interface FunctionMatch {
  type: 'ArrowFunctionExpression' | 'FunctionDeclaration' | 'FunctionExpression';
}

export type ObjectPatternNode = Extract<RuleNode, ObjectPatternMatch>;

export type ArrayPatternNode = Extract<RuleNode, ArrayPatternMatch>;

export type MemberExpressionNode = Extract<RuleNode, MemberExpressionMatch>;

// Read off the union, not a narrowed arm, so the null `id` that `export default function () {}` carries survives.
export type FunctionNode = Extract<RuleNode, FunctionMatch>;

// Taken from the method rather than guessed, so no call site needs a cast.
type CommentHost = Parameters<SourceCode['getCommentsInside']>[0];

export const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

// A prologue statement. typescript-eslint gives every ExpressionStatement a `directive` key, undefined off the
// prologue, so the string decides; the `in` narrows `object` for the compiler.
export const isDirective = (node: object): boolean => {
  return 'directive' in node && typeof node.directive === 'string';
};

// A lookup the parse guarantees will hit, so a throw here beats a silent `continue` scattered across every rule.
// `undefined` as well as `null`, because an index into a body the parse guarantees is the same promise.
export const mustFind = <Found>(found: Found | null | undefined): Found => {
  if (!found) {
    throw new Error('@linteljs/eslint-plugin: a lookup the parse guarantees came back empty. Please open an issue.');
  }

  return found;
};

export const rangeOf = (node: Ranged): AST.Range => {
  if (!node.range) {
    throw new Error('@linteljs/eslint-plugin: a parsed node carries no range. Please open an issue.');
  }

  return node.range;
};

// context.options is unknown[]; the one cast, sound since ESLint rejects a meta.schema mismatch before any visitor.
export const optionsOf = <T>(context: RuleContext): Partial<T> => {
  return (context.options[0] ?? {}) as Partial<T>;
};

// Whether a rebuild would drop a comment inside node; four rules can't carry one, so each reports without a fix.
export const rebuildLosesComments = (sourceCode: SourceCode, node: CommentHost): boolean => {
  return sourceCode.getCommentsInside(node).length > 0;
};
