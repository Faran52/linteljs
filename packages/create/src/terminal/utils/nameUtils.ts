// The project name, which is argv or a prompt rather than a recorded answer: `create` takes it on the command line
// or asks for it, and nothing outside this ring ever reads it back.
export const PROJECT_NAME_RULE
  = "a valid npm package name: lowercase letters, digits, '.', '-' and '_' only, starting with a letter or digit, "
    + 'at most 214 characters, and not a reserved npm name';

const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const RESERVED_PROJECT_NAMES = new Set(['favicon.ico', 'node_modules']);

export const isValidProjectName = (name: string): boolean => {
  return name.length <= 214
    && PROJECT_NAME_PATTERN.test(name)
    && !RESERVED_PROJECT_NAMES.has(name);
};
