import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ownBlockNames,
  ruleIdsFor,
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
  it('keeps the linteljs rules that have nothing to do with a DOM', async () => {
    const code = 'export const Note = (props) => {\n  return <Text>{props.a}</Text>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Note.tsx');

    expect(ruleIds).toContain('@linteljs/prefer-destructured-props');
  });

  it('drops the accessibility preset that react keeps', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const web = await ruleIdsFor([...base(), ...react()], code, 'src/Logo.tsx');
    const native = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Logo.tsx');

    expect(web).toContain('jsx-a11y-x/alt-text');
    expect(native.some(startsWith('jsx-a11y-x/'))).toBe(false);
  });

  it('reports a touchable with no accessible name', async () => {
    const code = 'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Save.tsx');

    expect(ruleIds).toContain('@linteljs/native-accessible-name');
  });

  it('reports an accessibility role React Native drops silently', async () => {
    const code = 'export const Save = () => {\n  return <Text accessibilityRole="searchbox">a</Text>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactNative()], code, 'src/Save.tsx');

    expect(ruleIds).toContain('@linteljs/native-valid-accessibility-role');
  });

  it('leaves those rules out of the react layer', async () => {
    const code = 'export const Save = () => {\n  return <Pressable onPress={() => {}} />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Save.tsx');

    expect(ruleIds).not.toContain('@linteljs/native-accessible-name');
  });

  it('reaches no module that imports the web accessibility plugin', async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const reads = ['reactNativeFramework.ts', '../utils/reactCoreUtils.ts']
      .map(async (name) => {
        return await readFile(join(here, name), 'utf8');
      });

    const sources = await Promise.all(reads);

    const specifiers = sources
      .flatMap((source) => {
        return [...source.matchAll(/from '([^']+)'/gu)]
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
    expect(ownBlockNames(reactNative())).toEqual([
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react',
      '@linteljs/react-native/accessibility',
    ]);
  });
});
