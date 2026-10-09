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
  {
    path: 'src/pages/home/HomePage.tsx',
    drawers: [
      'any/store-zustand',
      'any/store-tanstack-store',
      'any/store-redux-toolkit',
    ],
  },
  {
    path: 'src/lib/providers/store/StoreProvider.tsx',
    drawers: [
      'any/store-none',
      'any/store-zustand',
      'any/store-tanstack-store',
    ],
  },
  {
    path: 'src/lib/store/counter/counterStore.test.ts',
    drawers: [
      'any/store-zustand',
      'any/store-tanstack-store',
      'any/store-redux-toolkit',
    ],
  },
  {
    path: 'src/lib/providers/data/DataProvider.tsx',
    drawers: ['any/data-none', 'any/data-rtk-query'],
  },
  {
    path: 'src/pages/list/ListPage.tsx',
    drawers: ['any/data-tanstack-query', 'any/data-rtk-query'],
  },
  {
    path: 'src/pages/list/ListPage.test.tsx',
    drawers: ['any/data-tanstack-query', 'any/data-rtk-query'],
  },
  {
    path: 'src/components/features/item-list/ItemList.tsx',
    drawers: ['any/data-tanstack-query', 'any/data-rtk-query'],
  },
  {
    path: 'src/components/features/item-list/ItemList.test.tsx',
    drawers: ['any/data-tanstack-query', 'any/data-rtk-query'],
  },
  {
    path: 'public/api/items.json',
    drawers: ['any/data-tanstack-query', 'any/data-rtk-query'],
  },
  {
    path: 'src/components/ui/index.ts',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/components/ui/text-input/TextInput.tsx',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/components/ui/text-input/TextInput.test.tsx',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/pages/contact/ContactPage.tsx',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/pages/contact/ContactPage.test.tsx',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/pages/contact/use-contact-form/useContactForm.test.ts',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/lib/services/contact-form/contactFormService.ts',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/lib/services/contact-form/contactFormService.test.ts',
    drawers: ['any/form-tanstack-form', 'any/form-react-hook-form'],
  },
  {
    path: 'src/components/ui/text-input/TextInput.styles.ts',
    drawers: [
      'css/form-tanstack-form',
      'css/form-react-hook-form',
      'tailwind/form-tanstack-form',
      'tailwind/form-react-hook-form',
    ],
  },
  {
    path: 'src/components/ui/text-input/TextInput.css',
    drawers: [
      'css/form-tanstack-form',
      'css/form-react-hook-form',
      'tailwind/form-tanstack-form',
      'tailwind/form-react-hook-form',
    ],
  },
  {
    path: 'src/components/ui/text-input/TextInput.styles.ts',
    drawers: ['stylex/form-tanstack-form', 'stylex/form-react-hook-form'],
  },
  {
    path: 'src/components/features/app-header/AppHeader.styles.ts',
    drawers: ['css/base', 'tailwind/base'],
  },
  {
    path: 'src/components/features/app-header/AppHeader.css',
    drawers: ['css/base', 'tailwind/base'],
  },
  {
    path: 'src/components/ui/button/Button.styles.ts',
    drawers: ['css/base', 'tailwind/base'],
  },
  {
    path: 'src/components/ui/button/Button.css',
    drawers: ['css/base', 'tailwind/base'],
  },
  {
    path: 'src/components/ui/mark/Mark.styles.ts',
    drawers: ['css/base', 'tailwind/base'],
  },
  {
    path: 'src/components/ui/mark/Mark.css',
    drawers: ['css/base', 'tailwind/base'],
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
