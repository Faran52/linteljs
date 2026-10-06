import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers } from '@config/types';

import { gitignoreEmitter, mergeGitignore } from './gitignoreEmitter';

const ENTRIES = ['coverage/', '*.tsbuildinfo'];

const BASE = [
  'node_modules/',
  '.env',
  '.env.*',
  '!.env.example',
  '.DS_Store',
  'coverage/',
  '*.tsbuildinfo',
];

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

  it('adds nothing a second time, a negation included', () => {
    const entries = [
      '.env.*',
      '!.env.example',
      ...ENTRIES,
    ];
    const once = mergeGitignore('node_modules\n', entries);

    const mergedGitignore = mergeGitignore(once, entries);
    expect(mergedGitignore).toBe(once);
  });

  it('adds only the entry that is missing', () => {
    const mergedGitignore = mergeGitignore('coverage/\n', ENTRIES);
    expect(mergedGitignore).toBe('coverage/\n\n# linteljs\n*.tsbuildinfo\n');
  });

  it('appends a negation again after a pattern appended that would override it', () => {
    const mergedGitignore = mergeGitignore('.env\n!.env.example\n', [
      '.env',
      '.env.*',
      '!.env.example',
    ]);
    expect(mergedGitignore).toBe('.env\n!.env.example\n\n# linteljs\n.env.*\n!.env.example\n');
  });

  it('appends no negation when every pattern before it is already there', () => {
    const existing = '.env.*\n!.env.example\n';
    const mergedGitignore = mergeGitignore(existing, [
      '.env.*',
      '!.env.example',
      'coverage/',
    ]);
    expect(mergedGitignore).toBe(`${existing}\n# linteljs\ncoverage/\n`);
  });

  it('recognises an entry already there on a CRLF line ending', () => {
    const mergedGitignore = mergeGitignore('coverage/\r\n*.tsbuildinfo\r\n', ENTRIES);
    expect(mergedGitignore).toBe('coverage/\r\n*.tsbuildinfo\r\n');
  });
});

describe('gitignoreEmitter', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    [
      'angular',
      { target: 'angular' },
      [
        '/dist',
        '/tmp',
        '/out-tsc',
        '/bazel-out',
        '/.angular/cache',
      ],
    ],
    [
      'astro',
      { target: 'astro' },
      ['dist/', '.astro/'],
    ],
    [
      'next',
      { target: 'next' },
      [
        '/.next/',
        '/out/',
        '/build',
        '*.pem',
        '.vercel',
        'next-env.d.ts',
      ],
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      [
        '.output',
        '.data',
        '.nuxt',
        '.nitro',
        '.cache',
        'dist',
      ],
    ],
    [
      'react',
      { target: 'react' },
      [
        'dist',
        'dist-ssr',
        '*.local',
      ],
    ],
    [
      'react framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      ['/.react-router/', '/build/'],
    ],
    [
      'react-native',
      { target: 'react-native' },
      [
        '.expo/',
        'dist/',
        'web-build/',
        '.kotlin/',
        '*.orig.*',
        '*.jks',
        '*.p8',
        '*.p12',
        '*.key',
        '*.mobileprovision',
        '.metro-health-check*',
        '*.pem',
        '/ios',
        '/android',
      ],
    ],
    [
      'solid',
      { target: 'solid' },
      [
        'dist',
        'dist-ssr',
        '*.local',
      ],
    ],
    [
      'svelte',
      { target: 'svelte' },
      [
        '.output',
        '.vercel',
        '.netlify',
        '.wrangler',
        '/.svelte-kit',
        '/build',
        '!.env.test',
        'vite.config.js.timestamp-*',
        'vite.config.ts.timestamp-*',
      ],
    ],
    [
      'vue',
      { target: 'vue' },
      [
        'dist',
        'dist-ssr',
        '*.local',
      ],
    ],
    [
      'webextension',
      { target: 'webextension' },
      [
        'dist',
        'dist-ssr',
        '*.local',
      ],
    ],
  ])('writes the exact block for %s', (_label, overrides, own) => {
    const lines = linesOf(gitignoreFor({
      ...overrides,
      packageManager: 'pnpm',
    }));

    expect(lines).toEqual([
      '# linteljs',
      ...BASE,
      ...own,
      '',
    ]);
  });

  it("adds Yarn's own state on Yarn alone", () => {
    const lines = linesOf(gitignoreFor({
      target: 'vue',
      packageManager: 'yarn',
    }));

    expect(lines).toEqual([
      '# linteljs',
      ...BASE,
      '.yarn/*',
      '!.yarn/patches',
      '!.yarn/plugins',
      '!.yarn/releases',
      '!.yarn/sdks',
      '!.yarn/versions',
      '.pnp.*',
      'dist',
      'dist-ssr',
      '*.local',
      '',
    ]);
  });

  it('keeps what the project already ignores', () => {
    const gitignore = gitignoreFor({ target: 'vue' }, 'secrets/\n');
    const isKept = gitignore.startsWith('secrets/\n\n# linteljs\n');
    expect(isKept).toBe(true);
  });
});
