import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { AGE_GATE, HEAD } from './constants';
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
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
    packageManager: 'yarn',
  };
  return answers;
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
    const yarnrc = emitYarnrc(answersFor({}));
    expect(yarnrc).not.toContain('@tanstack/react-form');
  });

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

  it('writes the toolchain entries each of angular, astro and next needs', () => {
    const angular = emitYarnrc(answersFor({ target: 'angular' }));
    const astro = emitYarnrc(answersFor({ target: 'astro' }));

    expect(angular).toContain('  "@angular-eslint/schematics@*":\n');
    expect(angular).toContain('  "@napi-rs/wasm-runtime@*":\n');
    expect(astro).toContain('  "@astrojs/language-server@*":\n');
    expect(astro).toContain('  "@napi-rs/wasm-runtime@*":\n');
    const next = emitYarnrc(answersFor({ target: 'next' }));
    expect(next).toContain('  "@next/eslint-plugin-next@*":\n');
    const plain = emitYarnrc(answersFor({}));
    expect(plain).not.toContain('@napi-rs/wasm-runtime');
  });

  it('writes every extension under packageExtensions', () => {
    const nuxt = emitYarnrc(answersFor({ target: 'nuxt' }));
    const [, extensions = ''] = nuxt.split('packageExtensions:\n');

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

    expect(native).toContain('  "react-native-worklets@*":\n    dependencies:\n      "@babel/core": "^7"\n');
    expect(native).not.toContain('"@react-native/metro-config"');
    expect(native).toContain('  "expo-linking@*":\n    peerDependencies:\n      expo: "*"\n');
    expect(native).not.toContain('react-native-css');
    expect(native).toContain('  "jest-expo@*":\n    dependencies:\n      "@babel/core": "^7"\n    peerDependencies:\n');
    expect(styled).toContain(css);
    const plain = emitYarnrc(answersFor({}));
    expect(plain).not.toContain('react-native-worklets');
    expect(plain).not.toContain('@expo/cli');
    expect(plain).not.toContain('jest-expo');
  });

  it('walks the peers up that the router plugin and nuxt leave short', () => {
    const tanstack = emitYarnrc(answersFor({ router: 'tanstack-router' }));

    expect(tanstack).toContain(
      '  "@tanstack/eslint-plugin-router@*":\n    peerDependencies:\n      typescript: "*"\n',
    );

    const nuxt = emitYarnrc(answersFor({ target: 'nuxt' }));

    expect(nuxt).toContain(
      '  "nuxt@*":\n    peerDependencies:\n      vite: "*"\n'
      + '  "@nuxt/devtools@*":\n    peerDependencies:\n      vue: "*"\n',
    );

    const vue = emitYarnrc(answersFor({ target: 'vue' }));
    expect(vue).not.toContain('"nuxt@*"');
    const plain = emitYarnrc(answersFor({}));
    expect(plain).not.toContain('eslint-plugin-router');
  });

  it('discards no warning code on any target', () => {
    const targets = [
      'react',
      'angular',
      'react-native',
    ] as const;

    for (const target of targets) {
      const output = emitYarnrc(answersFor({ target }));

      const actual = output.startsWith(`${HEAD}packageExtensions:\n`);
      expect(actual).toBe(true);
    }
  });

  it('marks the peers their own tree supplies optional', () => {
    const vue = emitYarnrc(answersFor({ target: 'vue' }));

    expect(vue).toContain('  "postcss-html@*":\n    dependencies:\n      postcss: "^8.5.0"\n');

    expect(vue).toContain(
      '  "@vue/test-utils@*":\n    peerDependenciesMeta:\n      "@vue/compiler-dom":\n        optional: true\n',
    );

    expect(vue).toContain(
      '  "eslint-plugin-vuejs-accessibility@*":\n    peerDependenciesMeta:\n      globals:\n        optional: true\n',
    );

    const svelte = emitYarnrc(answersFor({ target: 'svelte' }));

    expect(svelte).toContain('  "postcss-html@*":\n');
    expect(svelte).not.toContain('@vue/test-utils');
    const yarnrc = emitYarnrc(answersFor({}));
    expect(yarnrc).not.toContain('postcss-html');
  });

  it.each([
    '4.10.1',
    '4.18.0',
  ])('holds a release two days back on yarn %s, linteljs exempt', (packageManagerVersion) => {
    const text = emitYarnrc({
      ...answersFor({}),
      packageManagerVersion,
    });

    expect(text).toContain(`${HEAD}${AGE_GATE}packageExtensions:\n`);
    expect(AGE_GATE).toBe('npmMinimalAgeGate: 2880\nnpmPreapprovedPackages:\n  - "@linteljs/*"\n');
  });

  it.each([
    '4.0.0',
    '4.9.4',
    '4.10.0',
  ])('writes no age gate on yarn %s, which refuses the setting', (packageManagerVersion) => {
    const text = emitYarnrc({
      ...answersFor({}),
      packageManagerVersion,
    });

    expect(text).toContain(`${HEAD}packageExtensions:\n`);
  });

  it('writes no age gate when no yarn version is recorded, since the floor refuses it', () => {
    const text = emitYarnrc(answersFor({}));

    expect(text).toContain(`${HEAD}packageExtensions:\n`);
  });
});

describe('yarnrcEmitter', () => {
  it('writes the yarnrc for berry and nothing for any other manager', () => {
    const berryArtifacts = yarnrcEmitter(answersFor({}));
    const text = emitYarnrc(answersFor({}));
    const expected = [{
      stage: 'package',
      target: '.yarnrc.yml',
      content: { text },
    }];
    expect(berryArtifacts).toEqual(expected);

    const artifacts = yarnrcEmitter({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    });

    expect(artifacts).toEqual([]);
  });
});
