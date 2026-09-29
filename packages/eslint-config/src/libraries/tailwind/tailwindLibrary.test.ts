import { join } from 'node:path';

import { ruleIdsFor, startsWith } from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import astro from '../../frameworks/astro/astroFramework';
import react from '../../frameworks/react/reactFramework';
import base from '../../layers/base/baseLayer';

import tailwind from './tailwindLibrary';

import type { Layer } from '../../types';

const CWD_SETTINGS: Layer = [{
  settings: { 'better-tailwindcss': { cwd: join(import.meta.dirname, '../../..') } },
}];

const layer = [...base(), ...react(), ...tailwind(), ...CWD_SETTINGS];

const ownBlockOf = (built: Layer): Layer[number] => {
  const block = built
    .find((entry) => {
      return entry.name === '@linteljs/tailwind';
    });

  if (block === undefined) {
    throw new Error('the tailwind layer no longer carries a @linteljs/tailwind block');
  }

  return block;
};

describe('tailwind', () => {
  it('reports a duplicate utility in a class string', async () => {
    const code = [
      'export const Card = () => {',
      '  return <div className="p-2 p-2">x</div>;',
      '};',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor(layer, code, 'src/components/Card.tsx');

    expect(ruleIds).toContain('better-tailwindcss/no-duplicate-classes');
  });

  it('reports a duplicate utility in the template of an astro page', async () => {
    const page = '---\n---\n\n<div class="p-2 p-2">x</div>\n';
    const astroLayer = [...base({ astro: true }), ...tailwind(), ...CWD_SETTINGS, ...astro()];
    const ruleIds = await ruleIdsFor(astroLayer, page, 'src/pages/index.astro');

    expect(ruleIds).toContain('better-tailwindcss/no-duplicate-classes');
  });

  it('reports classes out of the enforced order', async () => {
    const code = [
      'export const Card = () => {',
      '  return <div className="text-sm flex">x</div>;',
      '};',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor(layer, code, 'src/components/Card.tsx');

    expect(ruleIds).toContain('better-tailwindcss/enforce-consistent-class-order');
  });

  it('carries the entry point through to the plugin when given one', () => {
    expect(ownBlockOf(tailwind('./src/app/globals.css')).settings).toEqual(
      { 'better-tailwindcss': { entryPoint: './src/app/globals.css' } },
    );
  });

  it('sets no entry point when none is given', () => {
    expect(ownBlockOf(tailwind()).settings).toBeUndefined();
  });

  it('stays quiet on a clean class string', async () => {
    const code = [
      'export const Card = () => {',
      '  return <div className="flex p-2 text-sm">x</div>;',
      '};',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor(layer, code, 'src/components/Card.tsx');

    expect(ruleIds.some(startsWith('better-tailwindcss/'))).toBe(false);
  });

  it('leaves a class the theme does not know alone', async () => {
    const code = [
      'export const Card = () => {',
      '  return <div className="flex brand-card">x</div>;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor(layer, code, 'src/components/Card.tsx'))
      .resolves.not.toContain('better-tailwindcss/no-unknown-classes');
  });

  it.each([
    ['recommended', 'better-tailwindcss/recommended'],
  ])('names %s when eslint-plugin-better-tailwindcss stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-better-tailwindcss', key, async () => {
      return (await import('./tailwindLibrary')).tailwind;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
