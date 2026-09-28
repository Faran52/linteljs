import type {
  AST,
  Rule,
  Scope,
} from 'eslint';
import type { LintelRuleDefinition, LintelRuleModule } from '../types.ts';

export type RuleNode = Rule.Node;

export type Fixer = Rule.RuleFixer;

export type SourceCode = Rule.RuleContext['sourceCode'];

export type RuleContext = Rule.RuleContext;

// ESLint 10 added `JSXIdentifier` to a reference's identifier, which its types will not admit.
export type Ancestor
  = | ReturnType<SourceCode['getAncestors']>[number]
    | Scope.Reference['identifier'];

export interface AncestorReader {
  getAncestors(node: Ancestor): Ancestor[];
}

export type NodeLocation = AST.Token['loc'];

// Shaped rather than RuleNode so a test can call rangeOf({}) with no cast.
export interface Ranged {
  range?: AST.Range | undefined;
}

export interface TypedNode {
  type: string;
}

export interface NamedNode {
  name: string;
}

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

// Read off the union, so the null `id` of `export default function () {}` survives.
export type FunctionNode = Extract<RuleNode, FunctionMatch>;

// Taken from the method, so no call site needs a cast.
type CommentHost = Parameters<SourceCode['getCommentsInside']>[0];

export const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

// typescript-eslint gives every ExpressionStatement a `directive` key, so the string decides.
export const isDirective = (node: object): boolean => {
  return 'directive' in node && typeof node.directive === 'string';
};

export const isIdentifierNamed = (node: TypedNode & Partial<NamedNode>, name: string): boolean => {
  return node.type === 'Identifier' && node.name === name;
};

// A lookup the parse guarantees: a throw, whose stack names the call, where a silent `continue` would hide it.
export const mustFind = <Found>(found: Found | null | undefined): Found => {
  if (!found) {
    throw new Error('@linteljs/eslint-plugin: a lookup the parse promises came back empty. '
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

// The one cast, sound since ESLint rejects a meta.schema mismatch before any visitor.
export const optionsOf = <T>(context: RuleContext): Partial<T> => {
  return (context.options[0] ?? {}) as Partial<T>;
};

// A node's own scope finds nothing once the reference sits inside a function or block.
export const resolveVariable = (scope: Scope.Scope, name: string): Scope.Variable | null => {
  for (let current: Scope.Scope | null = scope; current; current = current.upper) {
    const found = current.variables
      .find((variable) => {
        return variable.name === name;
      });

    if (found) {
      return found;
    }
  }

  return null;
};

export const rebuildLosesComments = (sourceCode: SourceCode, node: CommentHost): boolean => {
  return sourceCode.getCommentsInside(node).length > 0;
};

// tree/, not blob/: GitHub renders a directory's README below the listing.
const DOCS_BASE = 'https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules';

export const docsUrl = (ruleName: string): string => {
  return `${DOCS_BASE}/${ruleName}`;
};

export const createRule = (
  name: string,
  definition: LintelRuleDefinition,
): LintelRuleModule => {
  return {
    ...definition,
    meta: {
      ...definition.meta,
      docs: {
        ...definition.meta.docs,
        url: docsUrl(name),
      },
    },
  };
};
