import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';

import react from './react';
import reactNative, { reactNativeGroup } from './reactNative';

describe('reactNative', () => {
  it('keeps the lintel rules that have nothing to do with a DOM', async () => {
    const code = 'export const Note = (props) => {\n  return <Text>{props.a}</Text>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Note.tsx');

    expect(ruleIds).toContain('@linteljs/prefer-destructured-props');
  });

  /**
   * Measured before the split: the same defect reports four findings as web markup and none as React Native markup,
   * because those rules key on lowercase element names and React Native renders `<Image>` and `<Text>`. The preset
   * was 34 rules that could not fire, so it is gone here and kept in `react()`.
   */
  it('drops the accessibility preset that react keeps', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const web = await ruleIdsFor([...base(), ...react()], code, 'src/Logo.tsx');
    const native = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Logo.tsx');

    expect(web).toContain('jsx-a11y-x/alt-text');
    expect(native.some(startsWith('jsx-a11y-x/'))).toBe(false);
  });

  // The replacement for the preset above: rules that read what React Native actually announces with.
  it('reports a touchable with no accessible name', async () => {
    const code = 'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Save.tsx');

    expect(ruleIds).toContain('@linteljs/react-native-accessible-name');
  });

  it('reports an accessibility role React Native drops silently', async () => {
    const code = 'export const Save = () => {\n  return <Text accessibilityRole="searchbox">a</Text>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Save.tsx');

    expect(ruleIds).toContain('@linteljs/react-native-valid-accessibility-role');
  });

  // Scoped to this layer alone: `Button` and `TextInput` are ordinary names that mean something else on the web.
  it('leaves those rules out of the react layer', async () => {
    const code = 'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Save.tsx');

    expect(ruleIds).not.toContain('@linteljs/react-native-accessible-name');
  });

  /**
   * The defect this guards: `reactNative()` used to compose `reactCore` out of `react.ts`, whose module-scope
   * `import jsxA11y from 'eslint-plugin-jsx-a11y-x'` runs on load. A React Native project no longer installs that
   * package, so ESLint died on ERR_MODULE_NOT_FOUND before reading a rule, on all four package managers. It cannot
   * be caught by running the layer here, where the package is installed either way, so the guard reads the source.
   */
  it('reaches no module that imports the web accessibility plugin', async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sources = await Promise.all(['reactNative.ts', 'reactCore.ts'].map(async (name) => {
      return await readFile(join(here, name), 'utf8');
    }));

    const specifiers = sources.flatMap((source) => {
      return [...source.matchAll(/from '([^']+)'/gu)].map(([, specifier]) => {
        return specifier;
      });
    });

    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers).not.toContain('eslint-plugin-jsx-a11y-x');
    expect(specifiers).not.toContain('./react');
  });

  // `^react-` already covers `react-native`, so there is no second group to keep in step with the first.
  it('sorts imports by the same group as react', () => {
    expect(reactNativeGroup).toContain('^react-');
  });
});
