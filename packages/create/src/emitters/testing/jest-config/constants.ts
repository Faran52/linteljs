// jest-expo resolves the `react-native` condition, where msw has no Node build, and three of msw's dependencies
// ship only ES modules, two of them as `.mjs`, which the preset neither transforms nor un-ignores.
export const MSW_IMPORT = "import expo from 'jest-expo/jest-preset.js';\n";

export const MSW_PARTS = String.raw`
const [modules, ...ignored] = expo.transformIgnorePatterns;
const esmOnly = '|rettime|until-async|@open-draft';
`;

export const MSW_OPTIONS = String.raw`
  testEnvironmentOptions: { customExportConditions: ['node', 'require', 'react-native'] },
  transform: { '\\.mjs$': expo.transform['\\.[jt]sx?$'] },
  transformIgnorePatterns: [modules.replace(/\)\)$/u, ${'`${esmOnly}))`'}), ...ignored],`;
