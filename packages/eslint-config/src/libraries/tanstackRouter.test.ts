import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import react from '../frameworks/react';

import tanstackRouter from './tanstackRouter';

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
});
