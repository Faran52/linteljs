import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { TEMPLATES_ROOT } from '@disk';

import { FRAMEWORKS } from './registry';

interface Copies {
  path: string;
  drawers: string[];
}

// A file several drawers of one question hold byte for byte, `react-tree.md`'s "(copy)".
const COPIES: Copies[] = [
  {
    path: 'src/main.tsx',
    drawers: [
      'any/router-none',
      'any/router-react-router',
      'any/router-tanstack-router',
    ],
  },
  {
    path: 'src/App.test.tsx',
    drawers: ['any/router-react-router', 'any/router-tanstack-router'],
  },
  {
    path: 'src/components/features/app-header/AppHeader.tsx',
    drawers: ['any/router-react-router', 'any/router-react-router-framework'],
  },
  {
    path: 'src/components/features/app-header/AppHeader.test.tsx',
    drawers: ['any/router-react-router', 'any/router-react-router-framework'],
  },
  {
    path: 'src/components/features/route-error/RouteError.tsx',
    drawers: ['any/router-react-router', 'any/router-react-router-framework'],
  },
  {
    path: 'src/components/features/route-error/RouteError.test.tsx',
    drawers: ['any/router-react-router', 'any/router-react-router-framework'],
  },
  {
    path: 'src/root.tsx',
    drawers: ['css/router-react-router-framework', 'tailwind/router-react-router-framework'],
  },
];

it('names only frameworks with a templates module', () => {
  const missing = FRAMEWORKS
    .filter((name) => {
      const module = join(TEMPLATES_ROOT, 'frameworks', name);

      return !existsSync(module);
    });

  expect(missing).toEqual([]);
});

it.each(COPIES)('holds every react copy of $path equal', async ({ path, drawers }) => {
  const reads = drawers
    .map(async (drawer) => {
      return await readFile(join(TEMPLATES_ROOT, 'frameworks', 'react', drawer, path), 'utf8');
    });
  const texts = await Promise.all(reads);
  const distinct = new Set(texts);

  expect(distinct.size).toBe(1);
});
