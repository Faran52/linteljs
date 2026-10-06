// `whitespace`: identical token stream afterwards; `reorder`: the same tokens in a different order.
export const FIX_SHAPES = ['whitespace', 'reorder'] as const;

// Split so a typescript rule never spends a traversal on a .js file.
export const RULE_LANGUAGES = ['universal', 'typescript'] as const;

export const TYPESCRIPT_FILES = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.mts',
  '**/*.cts',
] as const;

// A childless node's children: the recursive JSX walks end on it.
export const NO_CHILDREN: readonly never[] = [];

// Nodes that wrap an expression without changing its value: an optional chain, or a TS type wrapper.
export const TRANSPARENT_WRAPPER_TYPES = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
]);
