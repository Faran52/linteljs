import {
  AGENTS,
  DEFAULT_ANSWERS,
  isValidProjectName,
  PLUGINS,
  PROJECT_NAME_RULE,
} from './answers';

describe('answer vocabulary', () => {
  it('lists the supported agents and plugins with their defaults', () => {
    expect(AGENTS).toEqual(['claude-code', 'codex', 'copilot', 'cursor']);
    expect(PLUGINS).toEqual(['ponytail', 'context7', 'frontend-design']);
    expect(DEFAULT_ANSWERS.agents).toEqual(['claude-code']);
    expect(DEFAULT_ANSWERS.plugins).toEqual(PLUGINS);
  });
});

// npm's own floor is the stricter of the two the name has to satisfy, so meeting it also makes a safe directory.
describe('isValidProjectName', () => {
  it.each([
    ['a plain name', 'my-app'],
    ['a single character', 'a'],
    ['dots and underscores', 'demo.app_2'],
    ['the longest npm allows', 'a'.repeat(214)],
  ])('accepts %s', (_case, name) => {
    expect(isValidProjectName(name)).toBe(true);
  });

  it.each([
    ['nothing at all', ''],
    ['an uppercase letter', 'My-App'],
    ['a leading dot', '.hidden'],
    ['a leading dash', '-leading'],
    ['a space', 'my app'],
    ['a path separator', 'nested/app'],
    ['the npm install directory', 'node_modules'],
    ['the npm reserved asset', 'favicon.ico'],
    ['one character too many', 'a'.repeat(215)],
  ])('rejects %s', (_case, name) => {
    expect(isValidProjectName(name)).toBe(false);
  });

  it('describes the rule it enforces, for the message the question shows', () => {
    expect(PROJECT_NAME_RULE).toContain('npm package name');
  });
});
