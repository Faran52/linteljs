// `.d.ts` extensions are part of their specifier.
export const RELATIVE_TS_IMPORT
  = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"\n]*?)(?<!\.d)\.[cm]?tsx?\2/g;

export const IMPORT_CLAUSE = /import\s+\{([^}]*)\}\s+from\s+(['"])([^'"]+)\2/g;

// Literal `document` lookups only.
export const DOM_LOOKUP_ASSERTION
  = /document\.(getElementById|querySelector)(<[^>]+>)?\((['"])([^'"]+)\3\)!/g;

export const HOISTED_LOOKUP = new RegExp(
  [
    '^([ \\t]*)const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*',
    'document\\.(?:getElementById|querySelector)\\(([\'"])([^\'"]+)\\3\\);?[ \\t]*$',
  ].join(''),
  'm',
);
