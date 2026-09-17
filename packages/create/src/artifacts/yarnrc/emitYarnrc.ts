import { targetFor } from '../../model/targets';
import { buildDependencies, buildDevDependencies } from '../package-json/emitPackageJson';

import type { Answers } from '../../model/answers/answers';

const HEAD = `enableScripts: true
enableGlobalCache: true
nodeLinker: node-modules
`;

// The wasm fallback binding, never loaded on a platform with a native one. Two toolchains drag it in.
const WASM_RUNTIME = `  "@napi-rs/wasm-runtime@*":
    peerDependenciesMeta:
      "@emnapi/core":
        optional: true
      "@emnapi/runtime":
        optional: true
`;

/**
 * Yarn wants a peer provided by the dependent's own parent, and reports YN0086 when only the project has it. Adding
 * the peer to that parent walks the request up to the project, which installs it; marking it optional ends a request
 * the project has no business answering. Keyed by the package that brings the dependent, so a target carries only its
 * own. Measured per target with `yarn explain peer-requirements`.
 */
const PEER_EXTENSIONS: Record<string, string> = {
  '@commitlint/cli': `  "@commitlint/cli@*":
    peerDependencies:
      "@types/node": "*"
      typescript: "*"
  "@commitlint/load@*":
    peerDependencies:
      "@types/node": "*"
      typescript: "*"
`,
  // Vite 8 bundles rolldown rather than exposing it.
  '@rolldown/plugin-babel': `  "@rolldown/plugin-babel@*":
    peerDependenciesMeta:
      rolldown:
        optional: true
`,
  '@tanstack/react-form': `  "@tanstack/react-form@*":
    peerDependencies:
      react-dom: "*"
`,
  // stylelint 17 dropped postcss, so nothing declares one. Optional leaves YN0002 printing; DESIGN.md has why.
  'postcss-html': `  "postcss-html@*":
    dependencies:
      postcss: "^8.5.0"
`,
  // `vue` depends on the compiler; the project installs vue, not its internals.
  '@vue/test-utils': `  "@vue/test-utils@*":
    peerDependenciesMeta:
      "@vue/compiler-dom":
        optional: true
`,
  // eslint reaches `globals` through its own `@eslint/eslintrc`.
  'eslint-plugin-vuejs-accessibility': `  "eslint-plugin-vuejs-accessibility@*":
    peerDependenciesMeta:
      globals:
        optional: true
`,
  'angular-eslint': `${WASM_RUNTIME}  "@angular-eslint/schematics@*":
    peerDependencies:
      eslint: "*"
      typescript: "*"
  "@angular-eslint/utils@*":
    peerDependenciesMeta:
      "@typescript-eslint/utils":
        optional: true
  "@angular-eslint/eslint-plugin@*":
    peerDependenciesMeta:
      "@typescript-eslint/utils":
        optional: true
  "@angular-eslint/eslint-plugin-template@*":
    peerDependenciesMeta:
      "@angular-eslint/template-parser":
        optional: true
      "@typescript-eslint/types":
        optional: true
      "@typescript-eslint/utils":
        optional: true
  "angular-eslint@*":
    peerDependenciesMeta:
      typescript-eslint:
        optional: true
`,
  '@astrojs/check': `${WASM_RUNTIME}  "@astrojs/language-server@*":
    peerDependencies:
      typescript: "*"
`,
  '@next/eslint-plugin-next': `  "@next/eslint-plugin-next@*":
    peerDependencies:
      eslint: "*"
`,
};

// yaml needs a scoped name quoted.
const key = (name: string): string => {
  return name.startsWith('@') ? `"${name}"` : name;
};

// Peers asked by the scaffolder's own tree, which no emitted dependency keys.
const targetBlocks = (peerExtensions: Record<string, Record<string, string>>): string => {
  return Object.entries(peerExtensions).map(([dependent, peers]) => {
    const lines = Object.entries(peers).map(([peer, range]) => {
      return `      ${key(peer)}: "${range}"\n`;
    }).join('');

    return `  "${dependent}@*":\n    dependencies:\n${lines}`;
  }).join('');
};

const logFiltersBlock = (codes: string[]): string => {
  // yarn rejects a bare `logFilters:` key outright: an empty list has to omit it.
  if (codes.length === 0) {
    return '';
  }

  return `logFilters:\n${codes.map((code) => {
    return `  - code: "${code}"\n    level: "discard"\n`;
  }).join('')}`;
};

export const emitYarnrc = (answers: Answers): string => {
  const target = targetFor(answers);
  const installed = [...Object.keys(buildDependencies(answers)), ...Object.keys(buildDevDependencies(answers))];
  const blocks = [...new Set(installed.flatMap((name) => {
    return PEER_EXTENSIONS[name] === undefined ? [] : [PEER_EXTENSIONS[name]];
  }))].join('') + targetBlocks(target.peerExtensions ?? {});

  /**
   * A target naming `peerAllowances` knowingly exceeds a peer's range, and yarn can express no per-package allowance:
   * `packageExtensions` adds a range, it cannot widen one, and adding the one already there reports YN0069. Yarn
   * reports the clash as YN0060 with a YN0086 summary, so both go, and a new peer problem there is silent too.
   */
  const codes = Object.keys(target.peerAllowances ?? {}).length > 0
    ? ['YN0086', 'YN0060']
    : [];

  // Never empty: every target installs `@commitlint/cli`.
  return `${HEAD}${logFiltersBlock(codes)}packageExtensions:\n${blocks}`;
};
