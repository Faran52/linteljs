import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  esmAssetImports,
  tabsToSpaces,
  viteScaffold,
} from './targetUtils';

describe('viteScaffold', () => {
  it('always names the TypeScript template', () => {
    const spec = viteScaffold('react')('demo-app');

    expect(spec).toEqual({
      kind: 'create',
      args: ['vite', 'demo-app', '--template', 'react-ts', '--no-interactive', '--no-immediate'],
    });
  });

  it('adds --eslint only when asked for', () => {
    const withEslint = viteScaffold('react', true)('demo-app');
    const withoutEslint = viteScaffold('react')('demo-app');

    expect(withEslint.args).toContain('--eslint');
    expect(withoutEslint.args).not.toContain('--eslint');
  });

  it('always forces non-interactive mode', () => {
    expect(viteScaffold('vanilla')('demo-app').args).toEqual(
      expect.arrayContaining(['--no-interactive', '--no-immediate']),
    );
  });
});

describe('esmAssetImports', () => {
  const bindingsIn = (source: string): string[] => {
    return [...esmAssetImports(source).matchAll(/^import (\w+) from '(.+)';$/gm)].map((match) => {
      return `${String(match[1])} <- ${String(match[2])}`;
    });
  };

  it('numbers the second asset that claims a base name, rather than binding both to it', () => {
    const source = [
      "const home = require('./a/icon.png');",
      "const away = require('./b/icon.png');",
      '',
    ].join('\n');

    expect(bindingsIn(source)).toEqual([
      'iconAsset <- ./a/icon.png',
      'iconAsset2 <- ./b/icon.png',
    ]);
    expect(esmAssetImports(source)).toContain('const away = iconAsset2;');
  });

  it('keeps numbering past the second, and still binds a repeat of a path once', () => {
    const source = [
      "require('./a/icon.png');",
      "require('./b/icon.png');",
      "require('./c/icon.png');",
      "require('./b/icon.png');",
      '',
    ].join('\n');

    expect(bindingsIn(source)).toEqual([
      'iconAsset <- ./a/icon.png',
      'iconAsset2 <- ./b/icon.png',
      'iconAsset3 <- ./c/icon.png',
    ]);
  });

  it('drops the characters an identifier cannot carry', () => {
    // `@2x` is how a density variant is spelled, and a second dot is an ordinary naming habit.
    expect(bindingsIn("require('./icon@2x.png');")).toEqual(['icon2xAsset <- ./icon@2x.png']);
    expect(bindingsIn("require('./logo.dark.png');")).toEqual(['logodarkAsset <- ./logo.dark.png']);
  });

  it('prefixes a name that would otherwise open with a digit', () => {
    expect(bindingsIn("require('./2x.png');")).toEqual(['asset2xAsset <- ./2x.png']);
  });
});

describe('tabsToSpaces', () => {
  it('replaces each leading tab with two spaces', () => {
    expect(tabsToSpaces('\tone\n\t\ttwo\n')).toBe('  one\n    two\n');
  });

  it('leaves a line with no leading whitespace untouched', () => {
    expect(tabsToSpaces('one\ntwo\n')).toBe('one\ntwo\n');
  });

  it('leaves a tab that is not at the start of the line alone', () => {
    expect(tabsToSpaces('one\ttwo\n')).toBe('one\ttwo\n');
  });

  it('converts a mix of leading spaces and tabs, tabs only', () => {
    expect(tabsToSpaces(' \tone\n')).toBe('   one\n');
  });
});
