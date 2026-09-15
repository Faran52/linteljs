import { join } from 'node:path';

import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';
import react from '../frameworks/react';

import tailwind from './tailwind';

import type { Layer } from '../types';

// The plugin resolves `tailwindcss` from cwd, which is the repo root when the whole workspace runs.
const CWD_SETTINGS: Layer = [{
  settings: { 'better-tailwindcss': { cwd: join(import.meta.dirname, '../..') } },
}];

const layer = [...base(), ...react(), ...tailwind(), ...CWD_SETTINGS];

// By name: the preset ahead of it may grow a block.
const ownBlockOf = (built: Layer): Layer[number] => {
  const block = built.find((entry) => {
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

  // On the layer, not a lint run: proving the effect needs a real CSS entry with a custom token.
  it('carries the entry point through to the plugin when given one', () => {
    expect(ownBlockOf(tailwind('./src/app/globals.css')).settings).toEqual(
      { 'better-tailwindcss': { entryPoint: './src/app/globals.css' } },
    );
  });

  // The plugin treats an explicit undefined as a configured-but-missing entry.
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
});
