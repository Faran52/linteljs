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

// Where the parse put something. ESLint's own token type, since a node, a token and a comment share the shape.
export type NodeLocation = AST.Token['loc'];

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

/**
 * A lookup the parse guarantees will hit, under every parser the plugin ships with, so a throw here beats a silent
 * `continue` scattered across every rule. `undefined` as well as `null`, because an index into a body the parse
 * guarantees is the same promise. The throw aborts that file's lint, and ESLint appends the file, the line from
 * ESLint 9 on, and the rule id; what only the rule knows is which lookup failed, so `lookup` names it.
 */
export const mustFind = <Found>(found: Found | null | undefined, lookup: string): Found => {
  if (!found) {
    throw new Error(`@linteljs/eslint-plugin: ${lookup} was not found, which the parse promises. `
      + 'Please open an issue with the file and the parser it ran under.');
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

// Resolves a name against the scope chain, innermost first: a node's own scope finds nothing once the reference
// sits inside a function or block, and walking up also gets shadowing right for free.
export const resolveVariable = (scope: Scope.Scope, name: string): Scope.Variable | null => {
  for (let current: Scope.Scope | null = scope; current; current = current.upper) {
    const found = current.variables.find((variable) => {
      return variable.name === name;
    });

    if (found) {
      return found;
    }
  }

  return null;
};

// Whether a rebuild would drop a comment inside node; four rules can't carry one, so each reports without a fix.
export const rebuildLosesComments = (sourceCode: SourceCode, node: CommentHost): boolean => {
  return sourceCode.getCommentsInside(node).length > 0;
};
