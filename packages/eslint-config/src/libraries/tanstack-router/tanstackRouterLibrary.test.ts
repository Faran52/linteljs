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
    const joinList = [
      "import { createFileRoute } from '@tanstack/react-router';",
      '',
      "export const Route = createFileRoute('/')({",
      '  loader: () => 1,',
      '  beforeLoad: () => 1,',
      '});',
      '',
    ];
    const code = joinList.join('\n');
    const config = [...react(), ...tanstackRouter()];
    const ruleIds = await ruleIdsFor(config, code, 'src/routes/index.tsx');

    const anyMatch = ruleIds.some(startsWith('@tanstack/router/'));
    expect(anyMatch).toBe(true);
  });

  it.each([
    ['flat/recommended', 'tanstack-router/flat/recommended'],
  ])('names %s when @tanstack/eslint-plugin-router stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@tanstack/eslint-plugin-router', key, async () => {
      const tanstackRouterLibrary = await import('./tanstackRouterLibrary');
      return tanstackRouterLibrary.tanstackRouter;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
