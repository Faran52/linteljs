import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { HEAD } from './constants';
import { emitYarnrc, yarnrcEmitter } from './yarnrcEmitter';

import type {
  Answers,
  Data,
  Form,
  Library,
  Router,
  Styling,
  TargetId,
} from '@config/types';

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

  it('hands react-dom to the form store only when TanStack Form is chosen', () => {
    const output = emitYarnrc(answersFor({ form: 'tanstack-form' }));

    expect(output).toContain('  "@tanstack/react-form@*":\n    peerDependencies:\n      react-dom: "*"\n');
    expect(emitYarnrc(answersFor({}))).not.toContain('@tanstack/react-form');
  });

  // Measured on yarn 4: each left a YN0086 on an Angular project choosing TanStack Form and Query.
  it('answers the peers beneath the Angular TanStack packages only when they are chosen', () => {
    const chosen = emitYarnrc(answersFor({
      target: 'angular',
      form: 'tanstack-form',
      data: 'tanstack-query',
    }));
    const bare = emitYarnrc(answersFor({ target: 'angular' }));

    expect(chosen).toContain('  "@tanstack/angular-form@*":\n    peerDependencies:\n      "@angular/common": "*"\n');
    expect(chosen).toContain('  "goober@*":\n    peerDependenciesMeta:\n      csstype:\n        optional: true\n');
    expect(bare).not.toContain('@tanstack/angular-form');
    expect(bare).not.toContain('goober');
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

  // Hard peers no emitted manifest answers. Written only where the dependent is installed: yarn reports YN0068 for a
  // rule that matches nothing, so `react-native-css` rides with the tailwind answer that brings it.
  // Every entry nests under the one key, however many packages bring one.
  it('writes every extension under packageExtensions', () => {
    const [, extensions = ''] = emitYarnrc(answersFor({ target: 'nuxt' })).split('packageExtensions:\n');

    const topLevel = extensions
      .trimEnd()
      .split('\n')
      .filter((line) => {
        return !line.startsWith('  ');
      });

    expect(topLevel).toEqual([]);
  });

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

  // No `logFilters`: a peer problem on any target prints rather than being discarded.
  it('discards no warning code on any target', () => {
    for (const target of ['react', 'angular', 'react-native'] as const) {
      const output = emitYarnrc(answersFor({ target }));

      expect(output.startsWith(`${HEAD}packageExtensions:\n`)).toBe(true);
    }
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

describe('yarnrcEmitter', () => {
  // Berry reads `.yarnrc.yml`; every other manager, yarn 1 included, would carry a file it never reads.
  it('writes the yarnrc for berry and nothing for any other manager', () => {
    expect(yarnrcEmitter(answersFor({}))).toEqual([{
      stage: 'package',
      target: '.yarnrc.yml',
      content: { text: emitYarnrc(answersFor({})) },
    }]);
    const artifacts = yarnrcEmitter({
      ...DEFAULT_ANSWERS,
      packageManager: 'yarn-classic',
    });

    expect(artifacts).toEqual([]);
  });
});
