import {
  describe,
  expect,
  it,
} from 'vitest';

import react from '../../frameworks/react/reactFramework';

import tanstackQuery from './tanstackQueryLibrary';

import { ruleIdsFor, startsWith } from '#mocks/lintText';
import { layerWithoutConfig } from '#mocks/presets';

describe('tanstackQuery', () => {
  it('reports a query key missing a dependency', async () => {
    const code = [
      "import { useQuery } from '@tanstack/react-query';",
      '',
      'export const useThing = (id) => {',
      '  return useQuery({ queryKey: [\'thing\'], queryFn: () => fetch(`/thing/${id}`) });',
      '};',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor([...react(), ...tanstackQuery()], code, 'src/lib/hooks/useThing.ts');

    expect(ruleIds.some(startsWith('@tanstack/query/'))).toBe(true);
  });

  it.each([
    ['flat/recommended', 'tanstack-query/flat/recommended'],
  ])('names %s when @tanstack/eslint-plugin-query stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@tanstack/eslint-plugin-query', key, async () => {
      return (await import('./tanstackQueryLibrary')).tanstackQuery;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
