// `whitespace`: identical token stream afterwards; `reorder`: the same tokens in a different order.
export const FIX_SHAPES = ['whitespace', 'reorder'] as const;

// A typescript rule wastes a traversal on a .js file.
export const RULE_LANGUAGES = ['universal', 'typescript'] as const;

export const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'] as const;

// A childless node's children: the recursive JSX walks end on it.
export const NO_CHILDREN: readonly never[] = [];
