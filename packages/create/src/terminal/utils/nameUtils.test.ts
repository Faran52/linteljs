import { PROJECT_NAME_RULE } from '../constants';

import { isValidProjectDirName, isValidProjectName } from './nameUtils';

describe('isValidProjectName', () => {
  it.each([
    ['a plain name', 'my-app'],
    ['a single character', 'a'],
    ['dots and underscores', 'demo.app_2'],
    ['the longest npm allows', 'a'.repeat(214)],
    ['a scoped name', '@acme/my-app'],
  ])('accepts %s', (_case, name) => {
    const nameIsValidProjectName = isValidProjectName(name);
    expect(nameIsValidProjectName).toBe(true);
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
    ['a scope with no name', '@acme/'],
    ['a scope with an uppercase letter', '@Acme/my-app'],
    ['two scopes', '@acme/nested/app'],
    ['a reserved name under a scope', '@acme/node_modules'],
  ])('rejects %s', (_case, name) => {
    const nameIsValidProjectName = isValidProjectName(name);
    expect(nameIsValidProjectName).toBe(false);
  });

  it('describes the rule it enforces, for the message the question shows', () => {
    expect(PROJECT_NAME_RULE).toBe('a valid npm package name, scoped as @scope/name or not: lowercase letters, digits, '
      + "'.', '-' and '_' only, each part starting with a letter or digit, at most 214 characters, and not a reserved "
      + 'npm name');
  });
});

describe('isValidProjectDirName', () => {
  it.each([
    ['a kebab-case name', 'web-admin'],
    ['digits', 'app2'],
    ['the longest npm allows', 'a'.repeat(214)],
  ])('accepts %s', (_case, name) => {
    const isValid = isValidProjectDirName(name, 'acme', ['shared']);
    expect(isValid).toBe(true);
  });

  it.each([
    ['nothing at all', ''],
    ['an underscore', 'web_admin'],
    ['a dot', 'web.admin'],
    ['a scope', '@acme/web'],
    ['a double dash', 'web--admin'],
    ['a trailing dash', 'web-'],
    ['an uppercase letter', 'Web'],
    ['one character too many', 'a'.repeat(215)],
    ['the root package name', 'acme-workspace'],
    ['a name already taken', 'shared'],
  ])('rejects %s', (_case, name) => {
    const isValid = isValidProjectDirName(name, 'acme', ['shared']);
    expect(isValid).toBe(false);
  });

  it('names the root after the unscoped, kebab-cased workspace', () => {
    const isValid = isValidProjectDirName('my-acme-workspace', '@team/myAcme', []);
    expect(isValid).toBe(false);
  });
});
