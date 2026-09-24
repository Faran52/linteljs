export const HEAD = `enableScripts: true
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
export const PEER_EXTENSIONS: Record<string, string> = {
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
  // Every React Native project installs it for Reanimated, and it hard-peers two packages nothing declares.
  'react-native-worklets': `  "react-native-worklets@*":
    dependencies:
      "@babel/core": "^7"
      "@react-native/metro-config": "0.86.3"
`,
  // `react-native-css` comes with the tailwind answer on react-native, and hard-peers two packages nothing declares.
  'react-native-css': `  "react-native-css@*":
    dependencies:
      lightningcss: ">=1.27.0"
      "@expo/metro-config": ">=54"
`,
  // `@typescript-eslint/utils` beneath it peers typescript, which the plugin never passes down.
  '@tanstack/eslint-plugin-router': `  "@tanstack/eslint-plugin-router@*":
    peerDependencies:
      typescript: "*"
`,
  // nuxt hands neither vite to its builder and devtools, nor its devtools vue to `@vue/devtools-core`.
  'nuxt': `  "nuxt@*":
    peerDependencies:
      vite: "*"
  "@nuxt/devtools@*":
    peerDependencies:
      vue: "*"
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
