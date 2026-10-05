import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers } from '@config/types';

import { gitignoreEmitter, mergeGitignore } from './gitignoreEmitter';

const ENTRIES = ['coverage/', '*.tsbuildinfo'];

const gitignoreFor = (overrides: Partial<Answers>, existing: string | null = null): string => {
  const [artifact] = gitignoreEmitter(answersFor(overrides));

  return artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(existing) : '';
};

const linesOf = (text: string): string[] => {
  return text.split('\n');
};

describe('mergeGitignore', () => {
  it('appends the entries to a list already there', () => {
    const mergedGitignore = mergeGitignore('node_modules\ndist\n', ENTRIES);

    expect(mergedGitignore)
      .toBe('node_modules\ndist\n\n# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('terminates a last line left unterminated', () => {
    const mergedGitignore = mergeGitignore('node_modules', ENTRIES);
    expect(mergedGitignore).toBe('node_modules\n\n# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('writes the block alone where there is no .gitignore at all', () => {
    const mergedGitignore = mergeGitignore(null, ENTRIES);
    expect(mergedGitignore).toBe('# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('adds nothing a second time', () => {
    const once = mergeGitignore('node_modules\n', ENTRIES);

    const mergedGitignore = mergeGitignore(once, ENTRIES);
    expect(mergedGitignore).toBe(once);
  });

  it('adds only the entry that is missing', () => {
    const mergedGitignore = mergeGitignore('coverage/\n', ENTRIES);
    expect(mergedGitignore).toBe('coverage/\n\n# linteljs\n*.tsbuildinfo\n');
  });

  it('recognises an entry already there on a CRLF line ending', () => {
    const mergedGitignore = mergeGitignore('coverage/\r\n*.tsbuildinfo\r\n', ENTRIES);
    expect(mergedGitignore).toBe('coverage/\r\n*.tsbuildinfo\r\n');
  });
});

describe('gitignoreEmitter', () => {
  it('ignores dependencies, env files and what the scripts produce on every target', () => {
    const lines = linesOf(gitignoreFor({ target: 'vue' }));

    expect(lines).toEqual(expect.arrayContaining([
      'node_modules/',
      '.env',
      '.env.*',
      '!.env.example',
      '.DS_Store',
      'coverage/',
      '*.tsbuildinfo',
    ]));
  });

  it("adds the target's own build output", () => {
    const lines = linesOf(gitignoreFor({ target: 'astro' }));
    expect(lines).toEqual(expect.arrayContaining(['dist/', '.astro/']));
  });

  it('keeps an env file the target commits after the pattern that would ignore it', () => {
    const lines = linesOf(gitignoreFor({ target: 'svelte' }));

    const unignored = lines.indexOf('!.env.test');
    expect(unignored).toBeGreaterThan(lines.indexOf('.env.*'));
  });

  it("adds Yarn's own state on Yarn alone", () => {
    const yarn = linesOf(gitignoreFor({ packageManager: 'yarn' }));
    const pnpm = linesOf(gitignoreFor({ packageManager: 'pnpm' }));

    expect(yarn).toContain('.yarn/*');
    expect(pnpm).not.toContain('.yarn/*');
  });

  it('keeps what the project already ignores', () => {
    const gitignore = gitignoreFor({ target: 'vue' }, 'secrets/\n');
    const isKept = gitignore.startsWith('secrets/\n\n# linteljs\n');
    expect(isKept).toBe(true);
  });
});
