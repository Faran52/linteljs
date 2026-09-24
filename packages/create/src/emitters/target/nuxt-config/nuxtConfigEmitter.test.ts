import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { type Answers, type HostedAnswers } from '@answers';

import { emitNuxtConfig, nuxtConfigEmitter } from './nuxtConfigEmitter';

const answersFor = (overrides: Partial<Answers> = {}): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    target: 'nuxt',
    ...overrides,
  };
};

describe('nuxtConfigEmitter', () => {
  it('writes only for the target that reads the file', () => {
    expect(nuxtConfigEmitter(answersFor(), EMPTY_PROJECT, 'demo-app').map((artifact) => {
      return artifact.target;
    })).toEqual(['nuxt.config.ts']);
    expect(nuxtConfigEmitter(answersFor({ target: 'vue' }), EMPTY_PROJECT, 'demo-app')).toEqual([]);
  });

  /*
   * The two lines this target would not work without: Nuxt 4 looks for `app/`, and every glob this CLI writes
   * reads `src/`; and a project's own aliases reach Nuxt's generated paths through `alias` rather than `paths`.
   */
  it('names src as the source root and carries the aliases', () => {
    const config = emitNuxtConfig(answersFor());

    expect(config).toContain("srcDir: 'src/'");
    expect(config).toContain("'@config': join(import.meta.dirname, 'src/config'),");
    expect(config).toContain("'@config/*': join(import.meta.dirname, 'src/config/*'),");
  });

  /*
   * The Vite plugin rather than the PostCSS one, because Nuxt runs `postcss-import` ahead of its own `postcss`
   * key and that reads `@import "tailwindcss"` off disk. Measured: the build fails with ENOENT on `tailwindcss`.
   */
  it('reaches tailwind through vite, and only when tailwind was answered', () => {
    const tailwind = emitNuxtConfig(answersFor({ styling: 'tailwind' }));

    expect(tailwind).toContain("import tailwindcss from '@tailwindcss/vite';");
    expect(tailwind).toContain('plugins: [tailwindcss()],');
    expect(emitNuxtConfig(answersFor())).not.toContain('tailwindcss');
  });

  /*
   * StyleX reaches this target through the Vite config it owns rather than one this CLI emits, so the plugin is
   * named here instead. First, which its own documentation asks for: after the framework plugin it breaks Fast
   * Refresh.
   */
  it('names the stylex plugin first among the vite plugins', () => {
    const config = emitNuxtConfig(answersFor({ styling: 'stylex' }));

    expect(config).toContain("import { unpluginFactory as stylex } from '@stylexjs/unplugin';");
    expect(config).toContain('createUnplugin(stylex).vite({ useCSSLayers: true })');
  });
});
