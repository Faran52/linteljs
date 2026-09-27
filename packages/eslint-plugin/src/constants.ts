/**
 * How far a fixer may move the tokens it touches. A rule's domain lives in its id, not here.
 *
 * `whitespace`: the token stream is identical afterwards.
 * `reorder`: the same tokens in a different order.
 */
export const FIX_SHAPES = ['whitespace', 'reorder'] as const;

// Which files a rule can meaningfully run against; a typescript rule wastes a traversal on a .js file.
export const RULE_LANGUAGES = ['universal', 'typescript'] as const;

// Globs matching every file extension the TypeScript parser handles.
export const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'] as const;
