import {
  describe,
  expect,
  it,
} from 'vitest';

import { sortedImports } from './importUtils';

describe('sortedImports', () => {
  it('sorts packages by specifier, then the project files after a blank line', () => {
    const sorted = sortedImports([
      "import local from './local';",
      "import vue from '@vitejs/plugin-vue';",
      "import { defineConfig } from 'vite';",
      "import alias from './alias';",
    ]);

    expect(sorted).toBe([
      "import vue from '@vitejs/plugin-vue';",
      "import { defineConfig } from 'vite';",
      '',
      "import alias from './alias';",
      "import local from './local';",
    ].join('\n'));
  });

  it('leads with the framework group, as the emitted import sort has it', () => {
    const sorted = sortedImports([
      "import tailwindcss from '@tailwindcss/vite';",
      "import { defineNuxtConfig } from 'nuxt/config';",
      "import vue from '@vitejs/plugin-vue';",
    ], 'nuxt');

    expect(sorted).toBe([
      "import { defineNuxtConfig } from 'nuxt/config';",
      '',
      "import tailwindcss from '@tailwindcss/vite';",
      "import vue from '@vitejs/plugin-vue';",
    ].join('\n'));
  });

  it('sorts a name before a longer one it prefixes, as simple-import-sort does', () => {
    const sorted = sortedImports([
      "import solid from 'vite-plugin-solid';",
      "import { defineConfig } from 'vite';",
      "import tailwindcss from '@tailwindcss/vite';",
    ]);

    expect(sorted).toBe([
      "import tailwindcss from '@tailwindcss/vite';",
      "import { defineConfig } from 'vite';",
      "import solid from 'vite-plugin-solid';",
    ].join('\n'));
  });

  it('sorts a path segment before a dashed name, and numbers by value, as simple-import-sort does', () => {
    const sorted = sortedImports([
      "import dashed from 'a-b';",
      "import nested from 'a/b';",
      "import ten from 'x10';",
      "import two from 'x2';",
    ]);

    expect(sorted).toBe([
      "import nested from 'a/b';",
      "import dashed from 'a-b';",
      "import two from 'x2';",
      "import ten from 'x10';",
    ].join('\n'));
  });

  it('leaves no trailing blank line where the project imports nothing of its own', () => {
    const actual = sortedImports(["import { defineConfig } from 'vite';"]);
    expect(actual).toBe("import { defineConfig } from 'vite';");
  });
});
