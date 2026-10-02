import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type GateRow,
  mswGates,
  TAILWIND,
  walkGates,
  WITH_FORM,
  WITH_I18N,
  WITHOUT_I18N,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { astroTarget } from './astroTarget';
import { TRANSLATED } from './constants';

import type { Answers, HostedFramework } from '@config/types';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'astro',
    ...overrides,
  };
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  return astroTarget(answersFor(overrides));
};

describe('the astro record', () => {
  it('owns its document and its build', () => {
    expect(recordFor().html).toBe(false);
    expect(recordFor().vitePlugin).toBeUndefined();
    expect(recordFor().build).toBe('astro build');
  });

  it('runs its dev server and preview the way every other target does', () => {
    const scripts = recordFor().extraScripts;

    expect(scripts).toEqual({
      dev: 'astro dev',
      preview: 'astro preview',
    });
  });
});

describe('i18n', () => {
  it('translates through a client script of its own, with no library, compiler or test setup', () => {
    expect(recordFor().i18n).toEqual({ dependencies: [] });
  });
});

describe('the build it owns', () => {
  it('owns no vite config and borrows the resolved one for tests', () => {
    const record = recordFor();

    expect(record.vitePlugin).toBeUndefined();
    expect(record.vitestFactory?.call).toBe('getViteConfig');

    expect(record.vitestFactory?.imports).toEqual([
      "import { getViteConfig } from 'astro/config';",
      '',
      "import 'vitest/config';",
    ]);
  });

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
    [
      'react',
      'src/**/*.tsx',
      '@astrojs/react',
    ],
    [
      'vue',
      'src/**/*.vue',
      '@astrojs/vue',
    ],
    [
      'svelte',
      'src/**/*.svelte',
      '@astrojs/svelte',
    ],
    [
      'solid',
      'src/**/*.tsx',
      '@astrojs/solid-js',
    ],
  ])('composes %s as an island', (hostedFramework, componentGlob, integration) => {
    const record = recordFor({ hostedFramework });

    expect(record.framework).toBe(hostedFramework);
    expect(record.devDependencies).toContain(integration);
    expect(record.naming['src/**/*.astro']).toBe('!([a-z]*[A-Z]*)');
    expect(record.naming[componentGlob]).toBe('!([a-z]*[A-Z]*)');
  });

  it('leaves the react build plugin to the targets that own a vite config', () => {
    const { devDependencies } = recordFor({ hostedFramework: 'react' });

    expect(devDependencies).not.toContain('@vitejs/plugin-react');
    expect(devDependencies).toContain('oxc-transform-react');
  });

  it('brings the framework itself and its testing library beside astro', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    expect(record.dependencies).toEqual(['astro', 'vue']);
    expect(record.testDevDependencies).toEqual(['@vue/test-utils']);
    expect(record.stateRules).toEqual(['vue-reactivity.md']);
  });

  it('declares astro once, as a runtime dependency, hosted or not', () => {
    const records = [recordFor(), recordFor({ hostedFramework: 'react' })];

    for (const record of records) {
      expect(record.dependencies).toContain('astro');
      expect(record.devDependencies).not.toContain('astro');

      const astroEntries = record.devDependencies
        .filter((name) => {
          return name === 'astro';
        });

      expect(astroEntries).toHaveLength(0);
    }
  });

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

  it('allows the build script astro cannot install without', () => {
    expect(recordFor().allowBuilds).toContain('esbuild');
  });

  it('adds no tailwind adapter of its own', () => {
    expect(recordFor({ styling: 'tailwind' }).devDependencies).not.toContain('@tailwindcss/vite');
    expect(recordFor({ styling: 'tailwind' }).devDependencies).not.toContain('@tailwindcss/postcss');
  });
});

const GATES: GateRow[] = [
  ...mswGates(false),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['src/layouts/Layout.astro', [{ styling: [undefined, 'tailwind'], languages: [undefined] }]],
  ['src/layouts/Layout.astro@i18n', [{ styling: [undefined, 'tailwind'], languages: ANSWERED }]],
  ['src/layouts/Layout.astro@stylex', [{ styling: ['stylex'], languages: [undefined] }]],
  ['src/layouts/Layout.astro@stylex-i18n', [{ styling: ['stylex'], languages: ANSWERED }]],
  ...[
    'src/config/statuses.ts',
    'src/config/standard.ts',
    ...TRANSLATED,
  ]
    .flatMap((key): GateRow[] => {
      return [[key, WITHOUT_I18N], [`${key}@i18n`, WITH_I18N]];
    }),
  ...[
    'src/i18n/index.ts',
    'src/i18n/index.test.ts',
    'src/i18n/locales.test.ts',
    'src/components/ui/code-text/CodeText.astro',
    ...LANGUAGES
      .map((language) => {
        return `src/i18n/locales/${language}/common.json`;
      }),
  ]
    .map((key): GateRow => {
      return [`${key}@i18n`, WITH_I18N];
    }),
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
];

describe('the starter gates', () => {
  const walk = walkGates(astroTarget, 'astro');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const { starterFiles } = recordFor();
    const favicon = starterFiles
      .find((file) => {
        return file.target === 'public/favicon.svg';
      });

    expect(favicon).toEqual({
      target: 'public/favicon.svg',
      shared: true,
    });
  });
});

describe('the status pages', () => {
  it('writes a 403, a 404 and a 500 page under every answer set', () => {
    const { starterFiles } = recordFor();
    const pages = starterFiles
      .filter((file) => {
        return /^src\/pages\/\d{3}\.astro$/u.test(file.target);
      });

    expect(pages).toEqual([
      { target: 'src/pages/403.astro' },
      { target: 'src/pages/404.astro' },
      { target: 'src/pages/500.astro' },
    ]);
  });
});
