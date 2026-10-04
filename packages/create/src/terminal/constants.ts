// Argv or a prompt rather than a recorded answer: nothing outside this ring reads it back.
export const PROJECT_NAME_RULE
  = "a valid npm package name, scoped as @scope/name or not: lowercase letters, digits, '.', '-' and '_' only, "
    + 'each part starting with a letter or digit, at most 214 characters, and not a reserved npm name';

// npm's own ceiling on a package name.
export const MAX_PROJECT_NAME_LENGTH = 214;

export const PROJECT_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
export const RESERVED_PROJECT_NAMES = new Set(['favicon.ico', 'node_modules']);
