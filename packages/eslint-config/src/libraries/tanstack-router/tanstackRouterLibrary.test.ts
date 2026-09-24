import { ruleIdsFor, startsWith } from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import react from '../../frameworks/react/reactFramework';

import tanstackRouter from './tanstackRouterLibrary';

describe('tanstackRouter', () => {
  it('reports a loader declared ahead of the beforeLoad it depends on', async () => {
    const code = [
      "import { createFileRoute } from '@tanstack/react-router';",
      '',
      "export const Route = createFileRoute('/')({",
      '  loader: () => 1,',
      '  beforeLoad: () => 1,',
      '});',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor([...react(), ...tanstackRouter()], code, 'src/routes/index.tsx');

    expect(ruleIds.some(startsWith('@tanstack/router/'))).toBe(true);
  });

  it.each([
    ['flat/recommended', 'tanstack-router/flat/recommended'],
  ])('names %s when @tanstack/eslint-plugin-router stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@tanstack/eslint-plugin-router', key, async () => {
      return (await import('./tanstackRouterLibrary')).tanstackRouter;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
