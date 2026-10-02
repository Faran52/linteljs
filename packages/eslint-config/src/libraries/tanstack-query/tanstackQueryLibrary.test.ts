import { ruleIdsFor, startsWith } from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import react from '../../frameworks/react/reactFramework';

import tanstackQuery from './tanstackQueryLibrary';

describe('tanstackQuery', () => {
  it('reports a query key missing a dependency', async () => {
    const joinList = [
      "import { useQuery } from '@tanstack/react-query';",
      '',
      'export const useThing = (id) => {',
      '  return useQuery({ queryKey: [\'thing\'], queryFn: () => fetch(`/thing/${id}`) });',
      '};',
      '',
    ];
    const code = joinList.join('\n');
    const config = [...react(), ...tanstackQuery()];
    const ruleIds = await ruleIdsFor(config, code, 'src/lib/hooks/useThing.ts');

    const anyMatch = ruleIds.some(startsWith('@tanstack/query/'));
    expect(anyMatch).toBe(true);
  });

  it.each([
    ['flat/recommended', 'tanstack-query/flat/recommended'],
  ])('names %s when @tanstack/eslint-plugin-query stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@tanstack/eslint-plugin-query', key, async () => {
      const tanstackQueryLibrary = await import('./tanstackQueryLibrary');
      return tanstackQueryLibrary.tanstackQuery;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
