// Argv or a prompt rather than a recorded answer: nothing outside this ring reads it back.
export const PROJECT_NAME_RULE
  = "a valid npm package name: lowercase letters, digits, '.', '-' and '_' only, starting with a letter or digit, "
    + 'at most 214 characters, and not a reserved npm name';

export const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
export const RESERVED_PROJECT_NAMES = new Set(['favicon.ico', 'node_modules']);
