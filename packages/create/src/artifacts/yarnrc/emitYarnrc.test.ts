import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Form,
  type Library,
  type TargetId,
} from '../../model/answers/answers';

import { emitYarnrc } from './emitYarnrc';

const answersFor = (overrides: { target?: TargetId;
  libraries?: Library[];
  form?: Form; }): Answers => {
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
  });

  // The scaffolder's own tree asks for these, so no emitted dependency keys them.
  it('writes the peer extensions the target declares', () => {
    const native = emitYarnrc(answersFor({ target: 'react-native' }));

    expect(native).toContain(
      '  "react-native-css@*":\n    dependencies:\n      lightningcss: ">=1.27.0"\n'
      + '      "@expo/metro-config": ">=54"\n',
    );
    expect(native).toContain(
      '  "react-native-worklets@*":\n    dependencies:\n      "@babel/core": "^7"\n'
      + '      "@react-native/metro-config": "0.87.1"\n',
    );
    // A target declaring none carries none.
    expect(emitYarnrc(answersFor({}))).not.toContain('react-native-worklets');
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
