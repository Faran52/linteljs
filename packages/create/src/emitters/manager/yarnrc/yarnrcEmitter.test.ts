import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type Form,
  type Library,
  type Router,
  type Styling,
  type TargetId,
} from '@answers';

import { emitYarnrc } from './yarnrcEmitter';

interface AnswerOverrides {
  target?: TargetId;
  router?: Router;
  libraries?: Library[];
  form?: Form;
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
    packageManager: 'yarn',
  };
};

describe('emitYarnrc', () => {
  it('walks the commitlint peers up to the project on every target', () => {
    const output = emitYarnrc(answersFor({ target: 'vue' }));

    expect(output).toContain('nodeLinker: node-modules\n');
    expect(output).toContain(
      '  "@commitlint/cli@*":\n    peerDependencies:\n      "@types/node": "*"\n      typescript: "*"\n',
    );
    expect(output).toContain('  "@commitlint/load@*":\n');
  });

  // React installs the babel plugin; astro drops it, so the entry follows the dependency rather than the target.
  it('marks rolldown optional only where the babel plugin is installed', () => {
    const react = emitYarnrc(answersFor({}));

    expect(react).toContain(
      '  "@rolldown/plugin-babel@*":\n    peerDependenciesMeta:\n      rolldown:\n        optional: true\n',
    );
    expect(react).not.toContain('@tanstack/react-form');
    expect(emitYarnrc(answersFor({ target: 'astro' }))).not.toContain('rolldown');
  });

  it('hands react-dom to the form store only when TanStack Form is chosen', () => {
    const output = emitYarnrc(answersFor({ form: 'tanstack-form' }));

    expect(output).toContain('  "@tanstack/react-form@*":\n    peerDependencies:\n      react-dom: "*"\n');
  });

  // Angular and Astro both drag the wasm binding in, and a target installing neither must not carry it.
  it('writes the toolchain entries each of angular, astro and next needs', () => {
    const angular = emitYarnrc(answersFor({ target: 'angular' }));
    const astro = emitYarnrc(answersFor({ target: 'astro' }));

    expect(angular).toContain('  "@angular-eslint/schematics@*":\n');
    expect(angular).toContain('  "@napi-rs/wasm-runtime@*":\n');
    expect(astro).toContain('  "@astrojs/language-server@*":\n');
    expect(astro).toContain('  "@napi-rs/wasm-runtime@*":\n');
    expect(emitYarnrc(answersFor({ target: 'next' }))).toContain('  "@next/eslint-plugin-next@*":\n');
    expect(emitYarnrc(answersFor({}))).not.toContain('@napi-rs/wasm-runtime');
  });

  // The one peer yarn cannot be told about: `@angular/build` peers vitest 4 and the standard installs 5.
  it('discards both peer codes only for a target that declares an allowance', () => {
    const angular = emitYarnrc(answersFor({ target: 'angular' }));

    expect(angular).toContain('  - code: "YN0086"\n    level: "discard"\n');
    // The code yarn actually emits for the clash; the summary alone left it printing.
    expect(angular).toContain('  - code: "YN0060"\n    level: "discard"\n');
    expect(emitYarnrc(answersFor({}))).not.toContain('YN0086');
    expect(emitYarnrc(answersFor({}))).not.toContain('YN0060');
    // Measured without it: React Native's peers are all answered by packageExtensions, so it filters nothing.
    expect(emitYarnrc(answersFor({ target: 'react-native' }))).not.toContain('logFilters');
  });

  // Hard peers no emitted manifest answers. Written only where the dependent is installed: yarn reports YN0068 for a
  // rule that matches nothing, so `react-native-css` rides with the tailwind answer that brings it.
  it('writes the peer extensions for the packages the project installs', () => {
    const native = emitYarnrc(answersFor({ target: 'react-native' }));
    const styled = emitYarnrc(answersFor({
      target: 'react-native',
      styling: 'tailwind',
    }));
    const css = '  "react-native-css@*":\n    dependencies:\n      lightningcss: ">=1.27.0"\n'
      + '      "@expo/metro-config": ">=54"\n';

    // The project declares metro-config itself, so worklets' peer on it is answered without an extension.
    expect(native).toContain('  "react-native-worklets@*":\n    dependencies:\n      "@babel/core": "^7"\n');
    expect(native).not.toContain('"@react-native/metro-config"');
    expect(native).toContain('  "expo-linking@*":\n    peerDependencies:\n      expo: "*"\n');
    expect(native).not.toContain('react-native-css');
    expect(styled).toContain(css);
    // A target declaring none carries none.
    expect(emitYarnrc(answersFor({}))).not.toContain('react-native-worklets');
    expect(emitYarnrc(answersFor({}))).not.toContain('@expo/cli');
  });

  // Neither passes down a peer its own dependencies ask for, so the request stops short of the project.
  it('walks the peers up that the router plugin and nuxt leave short', () => {
    expect(emitYarnrc(answersFor({ router: 'tanstack-router' }))).toContain(
      '  "@tanstack/eslint-plugin-router@*":\n    peerDependencies:\n      typescript: "*"\n',
    );
    expect(emitYarnrc(answersFor({ target: 'nuxt' }))).toContain(
      '  "nuxt@*":\n    peerDependencies:\n      vite: "*"\n'
      + '  "@nuxt/devtools@*":\n    peerDependencies:\n      vue: "*"\n',
    );
    expect(emitYarnrc(answersFor({ target: 'vue' }))).not.toContain('"nuxt@*"');
    expect(emitYarnrc(answersFor({}))).not.toContain('eslint-plugin-router');
  });

  // yarn refuses the install outright on a `logFilters` key with nothing under it.
  it('omits the logFilters key entirely for a target with no allowance', () => {
    expect(emitYarnrc(answersFor({}))).not.toContain('logFilters');
    expect(emitYarnrc(answersFor({ target: 'angular' }))).toContain('logFilters:\n');
  });

  // Measured on vue and svelte: three YN0002 warnings for peers a tree the project does not own supplies.
  it('marks the peers their own tree supplies optional', () => {
    const vue = emitYarnrc(answersFor({ target: 'vue' }));

    expect(vue).toContain('  "postcss-html@*":\n    dependencies:\n      postcss: "^8.5.0"\n');
    expect(vue).toContain(
      '  "@vue/test-utils@*":\n    peerDependenciesMeta:\n      "@vue/compiler-dom":\n        optional: true\n',
    );
    expect(vue).toContain(
      '  "eslint-plugin-vuejs-accessibility@*":\n    peerDependenciesMeta:\n      globals:\n        optional: true\n',
    );
    // svelte carries the stylelint syntax too, and neither vue entry.
    const svelte = emitYarnrc(answersFor({ target: 'svelte' }));

    expect(svelte).toContain('  "postcss-html@*":\n');
    expect(svelte).not.toContain('@vue/test-utils');
    expect(emitYarnrc(answersFor({}))).not.toContain('postcss-html');
  });
});
