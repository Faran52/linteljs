import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../answers/answers';

import { astro } from './astro';

import type {
  Answers,
  HostedFramework,
  Library,
} from '../answers/answers';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'astro',
    ...overrides,
  };
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  return astro(answersFor(overrides));
};

describe('scaffold', () => {
  it('writes the exact argv for the default answers', () => {
    expect(recordFor().scaffold('demo-site', DEFAULT_ANSWERS)).toEqual({
      kind: 'create',
      args: [
        'astro@latest', 'demo-site',
        '--template', 'minimal',
        '--no-install',
        '--no-git',
        '--no-ai',
        '--skip-houston',
        '--yes',
      ],
    });
  });
});

describe('the build it owns', () => {
  // Astro's Vite options belong in `astro.config.mjs`; a `vite.config.ts` beside it would be read by nothing.
  it('owns no vite config and borrows the resolved one for tests', () => {
    const record = recordFor();

    expect(record.vite).toBe(false);
    expect(record.vitePlugin).toEqual({
      imports: [],
      calls: [],
    });
    expect(record.vitestFactory?.call).toBe('getViteConfig');
    // The second import is what makes `test` a legal key for `astro check`.
    expect(record.vitestFactory?.imports).toEqual([
      "import { getViteConfig } from 'astro/config';",
      "import 'vitest/config';",
    ]);
  });

  // Only `astro check` types a template, and the types it reads come from `astro sync`.
  it('gates on astro check, after a sync', () => {
    const record = recordFor();

    expect(record.typecheck).toBe('astro sync && astro check');
    expect(record.build).toBe('astro build');
    expect(record.prepare).toBe('astro sync');
  });

  it('extends the tsconfig astro publishes, and names the generated types', () => {
    const record = recordFor();

    expect(record.tsconfig.extends).toBe('astro/tsconfigs/strict');
    expect(record.tsconfig.include).toContain('.astro/types.d.ts');
    expect(record.tsconfig.include).toContain('**/*.astro');
  });

  // The html layer's parser cannot read a template's frontmatter fence.
  it('asks for the astro layer and not the html one', () => {
    expect(recordFor().astro).toBe(true);
    expect(recordFor().html).toBe(false);
  });
});

describe('the hosted framework axis', () => {
  it('hosts nothing by default, and is still a complete target', () => {
    const record = recordFor();

    expect(record.hostsFramework).toBe(true);
    expect(record.framework).toBeUndefined();
    expect(record.stateRules).toEqual([]);
    expect(record.dependencies).toEqual(['astro']);
    expect(record.naming['src/**/*.astro']).toBe('!([a-z]*[A-Z]*)');
  });

  it.each<[HostedFramework, string, string]>([
    ['react', 'src/**/*.tsx', '@astrojs/react'],
    ['vue', 'src/**/*.vue', '@astrojs/vue'],
    ['svelte', 'src/**/*.svelte', '@astrojs/svelte'],
    ['solid', 'src/**/*.tsx', '@astrojs/solid-js'],
  ])('composes %s as an island', (hostedFramework, componentGlob, integration) => {
    const record = recordFor({ hostedFramework });

    expect(record.framework).toBe(hostedFramework);
    expect(record.devDependencies).toContain(integration);
    expect(record.naming['src/**/*.astro']).toBe('!([a-z]*[A-Z]*)');
    expect(record.naming[componentGlob]).toBe('!([a-z]*[A-Z]*)');
  });

  // The build plugin would install and never be imported; the Babel two stay, since `@astrojs/react` loads them.
  it('leaves the react build plugin to the targets that own a vite config', () => {
    const { devDependencies } = recordFor({ hostedFramework: 'react' });

    expect(devDependencies).not.toContain('@vitejs/plugin-react');
    expect(devDependencies).toContain('babel-plugin-react-compiler');
    expect(devDependencies).toContain('@babel/core');
  });

  it('brings the framework itself and its testing library beside astro', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    expect(record.dependencies).toEqual(['astro', 'vue']);
    expect(record.testDevDependencies).toEqual(['@vue/test-utils']);
    expect(record.stateRules).toEqual(['vue-reactivity.md']);
  });

  // Runtime, where the node adapter's entry needs it; unconditional so a --skip-scaffold run installs it.
  it('declares astro once, as a runtime dependency, hosted or not', () => {
    const records = [recordFor(), recordFor({ hostedFramework: 'react' })];

    for (const record of records) {
      expect(record.dependencies).toContain('astro');
      expect(record.devDependencies).not.toContain('astro');
      expect(record.devDependencies.filter((name) => {
        return name === 'astro';
      })).toHaveLength(0);
    }
  });

  // `jsx` stays `preserve`; only Solid adds an import source.
  it('adds a jsx import source only where the framework needs one', () => {
    expect(recordFor({ hostedFramework: 'solid' }).tsconfig.jsxImportSource).toBe('solid-js');
    expect(recordFor({ hostedFramework: 'react' }).tsconfig.jsxImportSource).toBeUndefined();
    expect(recordFor().tsconfig.jsx).toBeUndefined();
  });

  it('installs its checker and the two packages the lint layer loads beside astro', () => {
    const record = recordFor();

    expect(record.dependencies).toContain('astro');
    expect(record.devDependencies).toContain('@astrojs/check');
    expect(record.devDependencies).toContain('eslint-plugin-astro');
    expect(record.devDependencies).toContain('astro-eslint-parser');
  });

  // Found by an install that aborted: pnpm refuses esbuild's script unless allowed by name.
  it('allows the build script astro cannot install without', () => {
    expect(recordFor().allowBuilds).toContain('esbuild');
  });

  // The adapter is chosen once, in the package-json emitter; the record adds nothing of its own.
  it('adds no tailwind adapter of its own', () => {
    const libraries: Library[] = ['tailwind'];

    expect(recordFor({ libraries }).devDependencies).not.toContain('@tailwindcss/vite');
    expect(recordFor({ libraries }).devDependencies).not.toContain('@tailwindcss/postcss');
  });

  // Nothing in an Astro scaffold typechecks against `@babel/core`: the wiring lives in `astro.config.mjs`.
  it('ships no babel type stub even when react is hosted', () => {
    expect(recordFor({ hostedFramework: 'react' }).devDependencies).not.toContain('@types/babel__core');
    expect(recordFor({ hostedFramework: 'react' }).devDependencies).toContain('@babel/core');
  });
});
