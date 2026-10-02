import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ownBlockNames,
  ruleEntryFor,
  ruleIdsFor,
  ruleNamesFor,
  startsWith,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import react from '../react/reactFramework';

import reactNative, { reactNativeGroup } from './reactNativeFramework';

describe('reactNative', () => {
  it.each([
    [
      'keeps the linteljs rules that have nothing to do with a DOM',
      'export const Note = (props) => {\n  return <Text>{props.a}</Text>;\n};\n',
      'src/Note.tsx',
      '@linteljs/prefer-destructured-props',
    ],
    [
      'reports a touchable with no accessible name',
      'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n',
      'src/Save.tsx',
      '@linteljs/native-accessible-name',
    ],
    [
      'reports an accessibility role React Native drops silently',
      'export const Save = () => {\n  return <Text accessibilityRole="searchbox">a</Text>;\n};\n',
      'src/Save.tsx',
      '@linteljs/native-valid-accessibility-role',
    ],
  ])('%s', async (_title, code, file, rule) => {
    const config = [...base(), ...reactNative()];
    const ruleIds = await ruleIdsFor(config, code, file);

    expect(ruleIds).toContain(rule);
  });

  it('drops the accessibility preset that react keeps', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const webConfig = [...base(), ...react()];
    const web = await ruleIdsFor(webConfig, code, 'src/Logo.tsx');
    const nativeConfig = [...base(), ...reactNative()];
    const native = await ruleIdsFor(nativeConfig, code, 'src/Logo.tsx');

    expect(web).toContain('jsx-a11y-x/alt-text');
    const webA11yReported = native.some(startsWith('jsx-a11y-x/'));
    expect(webA11yReported).toBe(false);
  });

  it.each([
    '@eslint-react/dom-no-missing-button-type',
    '@eslint-react/dom-no-missing-iframe-sandbox',
    '@eslint-react/dom-no-unsafe-target-blank',
  ])('leaves %s, a DOM rule react adds, out', async (ruleId) => {
    const ruleNames = await ruleNamesFor(reactNative(), 'src/Save.tsx');

    expect(ruleNames).not.toContain(ruleId);
  });

  it('keeps dom-no-script-url at the preset severity react raises', async () => {
    const entry = await ruleEntryFor(reactNative(), 'src/Save.tsx', '@eslint-react/dom-no-script-url');

    const expected = [1];
    expect(entry).toEqual(expected);
  });

  it('leaves those rules out of the react layer', async () => {
    const code = 'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n';
    const config = [...base(), ...react()];
    const ruleIds = await ruleIdsFor(config, code, 'src/Save.tsx');

    expect(ruleIds).not.toContain('@linteljs/native-accessible-name');
  });

  it('reaches no module that imports the web accessibility plugin', async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const modules = ['reactNativeFramework.ts', '../utils/reactCoreUtils.ts'];
    const reads = modules
      .map((name) => {
        const path = join(here, name);
        return readFile(path, 'utf8');
      });

    const sources = await Promise.all(reads);

    const specifiers = sources
      .flatMap((source) => {
        const imports = [...source.matchAll(/from '([^']+)'/gu)];
        return imports
          .map(([, specifier]) => {
            return specifier;
          });
      });

    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers).not.toContain('eslint-plugin-jsx-a11y-x');
    expect(specifiers).not.toContain('./react');
  });

  it('sorts imports by the same group as react', () => {
    expect(reactNativeGroup).toContain('^react-');
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(reactNative());
    const expected = [
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react/sonarjs',
      '@linteljs/react',
      '@linteljs/react-native/accessibility',
    ];
    expect(actual).toEqual(expected);
  });
});
