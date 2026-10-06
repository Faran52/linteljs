import {
  describe,
  expect,
  it,
} from 'vitest';

import { PARTS } from '../../constants';
import { BROWSERS, CRX } from '../constants';

import { hostedRecordParts } from './hostedRecordUtils';

describe('hostedRecordParts', () => {
  it('gives a bare extension the crx plugin, its browser types and no framework', () => {
    const parts = hostedRecordParts(undefined, BROWSERS.chrome);

    expect(parts.framework).toBeUndefined();
    expect(parts.vitePlugin).toStrictEqual(CRX);
    expect(parts.tsconfig).toStrictEqual({ types: BROWSERS.chrome.types });

    expect(parts.devDependencies).toStrictEqual([
      '@crxjs/vite-plugin',
      'vite',
      ...BROWSERS.chrome.devDependencies,
    ]);

    expect(parts.allowBuilds).toStrictEqual([]);
    expect(parts.stateRules).toStrictEqual([]);
    expect(parts.naming['src/components/**/!(*.d|*.test|*.spec).ts']).toBe('PASCAL_CASE');
  });

  it('puts the hosted plugin before crx, which wraps it', () => {
    const parts = hostedRecordParts(PARTS.vue, BROWSERS.firefox);
    const calls = parts.vitePlugin?.calls ?? [];
    const firstCall = calls.at(0);
    const lastCall = calls.at(-1);

    expect(firstCall).toBe(PARTS.vue.vitePlugin.calls.at(0));
    expect(lastCall).toBe(CRX.calls.at(-1));
    expect(parts.sfcExtension).toBe('vue');
    expect(parts.allowBuilds).toStrictEqual(['vue-demi']);
    expect(parts).not.toHaveProperty('testConditions');
  });

  it('carries the JSX settings and test conditions of the hosted framework', () => {
    const parts = hostedRecordParts(PARTS.solid, BROWSERS.chrome);

    expect(parts.framework).toBe('solid');

    expect(parts.tsconfig).toStrictEqual({
      types: BROWSERS.chrome.types,
      jsx: 'preserve',
      jsxImportSource: 'solid-js',
    });

    expect(parts.testConditions).toStrictEqual(['development', 'browser']);
    expect(parts.dependencies).toBe(PARTS.solid.dependencies);
    expect(parts.testDevDependencies).toBe(PARTS.solid.testDevDependencies);
    expect(parts.stateRules).toBe(PARTS.solid.stateRules);
    const hostedTail = parts.devDependencies.slice(-PARTS.solid.devDependencies.length);

    expect(hostedTail).toStrictEqual(PARTS.solid.devDependencies);

    expect(parts).not.toHaveProperty('sfcExtension');
  });

  it('leaves out the JSX keys a framework does not set', () => {
    const parts = hostedRecordParts(PARTS.svelte, BROWSERS.chrome);

    expect(parts.tsconfig).toStrictEqual({ types: BROWSERS.chrome.types });
    expect(parts.allowBuilds).toStrictEqual([]);
  });
});
