import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitNuxtConfig, nuxtConfigEmitter } from './nuxtConfigEmitter';

import type { Answers, HostedAnswers } from '@config/types';

const answersFor = (overrides: Partial<Answers> = {}): HostedAnswers => {
  const answers: HostedAnswers = {
    ...HOSTED_DEFAULTS,
    target: 'nuxt',
    ...overrides,
  };
  return answers;
};

const PLAIN = `import { join } from 'node:path';

import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'src/',
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'demo-app',
      link: [{
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      }],
    },
  },
  css: ['~/styles/main.css'],
  // Merged into the paths Nuxt generates, which is what keeps its own \`#\` aliases resolving alongside these.
  alias: {
    '@views': join(import.meta.dirname, 'src/views'),
    '@views/*': join(import.meta.dirname, 'src/views/*'),
    '@components': join(import.meta.dirname, 'src/components'),
    '@components/*': join(import.meta.dirname, 'src/components/*'),
    '@ui': join(import.meta.dirname, 'src/components/ui'),
    '@ui/*': join(import.meta.dirname, 'src/components/ui/*'),
    '@features': join(import.meta.dirname, 'src/components/features'),
    '@features/*': join(import.meta.dirname, 'src/components/features/*'),
    '@lib': join(import.meta.dirname, 'src/lib'),
    '@lib/*': join(import.meta.dirname, 'src/lib/*'),
    '@store': join(import.meta.dirname, 'src/lib/store'),
    '@store/*': join(import.meta.dirname, 'src/lib/store/*'),
    '@composables': join(import.meta.dirname, 'src/lib/composables'),
    '@composables/*': join(import.meta.dirname, 'src/lib/composables/*'),
    '@utils': join(import.meta.dirname, 'src/lib/utils'),
    '@utils/*': join(import.meta.dirname, 'src/lib/utils/*'),
    '@services': join(import.meta.dirname, 'src/lib/services'),
    '@services/*': join(import.meta.dirname, 'src/lib/services/*'),
    '@styles': join(import.meta.dirname, 'src/styles'),
    '@styles/*': join(import.meta.dirname, 'src/styles/*'),
    '@config': join(import.meta.dirname, 'src/config'),
    '@config/*': join(import.meta.dirname, 'src/config/*'),
    '@mocks': join(import.meta.dirname, '__mocks__'),
    '@mocks/*': join(import.meta.dirname, '__mocks__/*'),
  },
});
`;

const WITH_STYLEX = `import { join } from 'node:path';

import { defineNuxtConfig } from 'nuxt/config';

import { type UserOptions } from '@stylexjs/unplugin';
import stylexVite from '@stylexjs/unplugin/vite';
import { type VitePlugin } from 'unplugin';

const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;
const stylexAliases = { '@styles/*': [join(import.meta.dirname, 'src/styles/*')] };

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'src/',
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'demo-app',
      link: [{
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      }],
    },
  },
  $development: {
    app: {
      head: {
        script: [{
          type: 'module',
          src: '/_nuxt/@id/virtual:stylex:runtime',
        }],
        link: [{
          rel: 'stylesheet',
          href: '/virtual:stylex.css',
        }],
      },
    },
  },
  css: ['~/styles/main.css'],
  // Merged into the paths Nuxt generates, which is what keeps its own \`#\` aliases resolving alongside these.
  alias: {
    '@views': join(import.meta.dirname, 'src/views'),
    '@views/*': join(import.meta.dirname, 'src/views/*'),
    '@components': join(import.meta.dirname, 'src/components'),
    '@components/*': join(import.meta.dirname, 'src/components/*'),
    '@ui': join(import.meta.dirname, 'src/components/ui'),
    '@ui/*': join(import.meta.dirname, 'src/components/ui/*'),
    '@features': join(import.meta.dirname, 'src/components/features'),
    '@features/*': join(import.meta.dirname, 'src/components/features/*'),
    '@lib': join(import.meta.dirname, 'src/lib'),
    '@lib/*': join(import.meta.dirname, 'src/lib/*'),
    '@store': join(import.meta.dirname, 'src/lib/store'),
    '@store/*': join(import.meta.dirname, 'src/lib/store/*'),
    '@composables': join(import.meta.dirname, 'src/lib/composables'),
    '@composables/*': join(import.meta.dirname, 'src/lib/composables/*'),
    '@utils': join(import.meta.dirname, 'src/lib/utils'),
    '@utils/*': join(import.meta.dirname, 'src/lib/utils/*'),
    '@services': join(import.meta.dirname, 'src/lib/services'),
    '@services/*': join(import.meta.dirname, 'src/lib/services/*'),
    '@styles': join(import.meta.dirname, 'src/styles'),
    '@styles/*': join(import.meta.dirname, 'src/styles/*'),
    '@config': join(import.meta.dirname, 'src/config'),
    '@config/*': join(import.meta.dirname, 'src/config/*'),
    '@mocks': join(import.meta.dirname, '__mocks__'),
    '@mocks/*': join(import.meta.dirname, '__mocks__/*'),
  },
  vite: {
    plugins: [stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })],
  },
});
`;

describe('nuxtConfigEmitter', () => {
  it('writes only for the target that reads the file', () => {
    const nuxtArtifacts = nuxtConfigEmitter(answersFor(), EMPTY_PROJECT, 'demo-app');
    const expected = [{
      stage: 'package',
      target: 'nuxt.config.ts',
      content: { text: PLAIN },
    }];
    expect(nuxtArtifacts).toEqual(expected);

    const vueArtifacts = nuxtConfigEmitter(answersFor({ target: 'vue' }), EMPTY_PROJECT, 'demo-app');
    expect(vueArtifacts).toEqual([]);
  });

  it('names src as the source root and carries the aliases', () => {
    const nuxtConfig = emitNuxtConfig(answersFor(), 'demo-app');
    expect(nuxtConfig).toBe(PLAIN);
  });

  it('escapes a trailing backslash in an alias path so the config still parses', () => {
    const config = emitNuxtConfig(answersFor({ aliases: { '@odd/*': './a\\/*' } }), 'demo-app');

    expect(config).toContain("'@odd': join(import.meta.dirname, 'a\\\\'),");
  });

  it('reaches tailwind through vite, and only when tailwind was answered', () => {
    const tailwind = emitNuxtConfig(answersFor({ styling: 'tailwind' }), 'demo-app');

    const imports = "import { defineNuxtConfig } from 'nuxt/config';\n\nimport tailwindcss from '@tailwindcss/vite';";

    expect(tailwind).toContain(imports);
    expect(tailwind).toContain('plugins: [tailwindcss()],');
    const nuxtConfig = emitNuxtConfig(answersFor(), 'demo-app');
    expect(nuxtConfig).not.toContain('tailwindcss');
  });

  it('names the stylex plugin among the vite plugins', () => {
    const nuxtConfig = emitNuxtConfig(answersFor({ styling: 'stylex' }), 'demo-app');
    expect(nuxtConfig).toBe(WITH_STYLEX);
  });
});
