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

// A parsed thing carrying a source range; shaped rather than RuleNode so a test can call rangeOf({}) with no cast.
export interface Ranged {
  range?: AST.Range | undefined;
}

// Taken from the method rather than guessed, so no call site needs a cast.
type CommentHost = Parameters<SourceCode['getCommentsInside']>[0];

export const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

// A lookup the parse guarantees will hit, so a throw here beats a silent `continue` scattered across every rule.
export const mustFind = <Found>(found: Found | null): Found => {
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
