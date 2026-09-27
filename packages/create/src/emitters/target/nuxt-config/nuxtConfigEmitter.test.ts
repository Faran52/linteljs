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
  return {
    ...HOSTED_DEFAULTS,
    target: 'nuxt',
    ...overrides,
  };
};

const PLAIN = `import { join } from 'node:path';

import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // \`src/\`, not Nuxt 4's own \`app/\`: one source root, the same as every other target this CLI writes.
  srcDir: 'src/',
  devtools: { enabled: false },
  css: ['~/styles/main.css'],
  // Merged into the paths Nuxt generates, which is what keeps its own \`#\` aliases resolving alongside these.
  alias: {
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
    '@config': join(import.meta.dirname, 'src/config'),
    '@config/*': join(import.meta.dirname, 'src/config/*'),
    '@mocks': join(import.meta.dirname, '__mocks__'),
    '@mocks/*': join(import.meta.dirname, '__mocks__/*'),
  },
});
`;

const WITH_STYLEX = `import { join } from 'node:path';

import { type UserOptions } from '@stylexjs/unplugin';
import stylexVite from '@stylexjs/unplugin/vite';
import { defineNuxtConfig } from 'nuxt/config';
import { type VitePlugin } from 'unplugin';

const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // \`src/\`, not Nuxt 4's own \`app/\`: one source root, the same as every other target this CLI writes.
  srcDir: 'src/',
  devtools: { enabled: false },
  css: ['~/styles/main.css'],
  // Merged into the paths Nuxt generates, which is what keeps its own \`#\` aliases resolving alongside these.
  alias: {
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
    '@config': join(import.meta.dirname, 'src/config'),
    '@config/*': join(import.meta.dirname, 'src/config/*'),
    '@mocks': join(import.meta.dirname, '__mocks__'),
    '@mocks/*': join(import.meta.dirname, '__mocks__/*'),
  },
  vite: {
    plugins: [stylex({ useCSSLayers: true })],
  },
});
`;

describe('nuxtConfigEmitter', () => {
  it('writes only for the target that reads the file', () => {
    expect(nuxtConfigEmitter(answersFor(), EMPTY_PROJECT, 'demo-app')).toEqual([{
      stage: 'package',
      target: 'nuxt.config.ts',
      content: { text: PLAIN },
    }]);
    expect(nuxtConfigEmitter(answersFor({ target: 'vue' }), EMPTY_PROJECT, 'demo-app')).toEqual([]);
  });

  it('names src as the source root and carries the aliases', () => {
    expect(emitNuxtConfig(answersFor())).toBe(PLAIN);
  });

  it('reaches tailwind through vite, and only when tailwind was answered', () => {
    const tailwind = emitNuxtConfig(answersFor({ styling: 'tailwind' }));

    expect(tailwind).toContain("import tailwindcss from '@tailwindcss/vite';");
    expect(tailwind).toContain('plugins: [tailwindcss()],');
    expect(emitNuxtConfig(answersFor())).not.toContain('tailwindcss');
  });

  it('names the stylex plugin among the vite plugins', () => {
    expect(emitNuxtConfig(answersFor({ styling: 'stylex' }))).toBe(WITH_STYLEX);
  });
});
