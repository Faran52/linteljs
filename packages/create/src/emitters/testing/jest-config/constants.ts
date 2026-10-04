/**
 * jest-expo resolves the `react-native` condition, where msw has no Node build and immer and react-redux point at
 * an ES module. Those and msw's dependencies ship ES modules the preset does not un-ignore, two of msw's as `.mjs`,
 * which it does not transform either. Yarn nests those under `msw/node_modules/`, so msw itself is un-ignored too.
 */
export const PRESET_IMPORT = "import expo from 'jest-expo/jest-preset.js';\n\n";

export const MSW_ESM_ONLY = [
  'msw',
  'rettime',
  'until-async',
  '@open-draft',
];

export const REDUX_ESM_ONLY = [
  'immer',
  'react-redux',
];

export const MSW_OPTIONS = String.raw`
  testEnvironmentOptions: { customExportConditions: [
    'node',
    'require',
    'react-native',
  ] },
  transform: { '\\.mjs$': expo.transform['\\.[jt]sx?$'] },`;

export const UNIGNORE_OPTION = String.raw`
  transformIgnorePatterns: [modules.replace(/\)\)$/u, ${'`${esmOnly}))`'}), ...ignored],`;
