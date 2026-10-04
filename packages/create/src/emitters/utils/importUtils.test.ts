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

    const lines = [
      "import vue from '@vitejs/plugin-vue';",
      "import { defineConfig } from 'vite';",
      '',
      "import alias from './alias';",
      "import local from './local';",
    ];
    const expected = lines.join('\n');
    expect(sorted).toBe(expected);
  });

  it('leads with the framework group, as the emitted import sort has it', () => {
    const sorted = sortedImports([
      "import tailwindcss from '@tailwindcss/vite';",
      "import { defineNuxtConfig } from 'nuxt/config';",
      "import vue from '@vitejs/plugin-vue';",
    ], 'nuxt');

    const lines = [
      "import { defineNuxtConfig } from 'nuxt/config';",
      '',
      "import tailwindcss from '@tailwindcss/vite';",
      "import vue from '@vitejs/plugin-vue';",
    ];
    const expected = lines.join('\n');
    expect(sorted).toBe(expected);
  });

  // Each framework group is a static mutant, rerun with the whole suite; failing here kills it before the suite ends.
  it.each([
    ['react', [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router',
      '@react-aria/focus',
    ]],
    ['next', [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router',
      '@react-aria/focus',
      'next',
      'next/link',
    ]],
    ['react-native', [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-native',
      '@react-navigation/native',
    ]],
    ['vue', [
      'vue',
      'vue-router',
      'pinia',
      '@vue/test-utils',
    ]],
    ['nuxt', [
      'vue',
      'vue-router',
      'pinia',
      '@vue/test-utils',
      'nuxt',
      'nuxt/config',
      '#imports',
    ]],
    ['svelte', [
      'svelte',
      'svelte/store',
      '@sveltejs/kit',
      '$app/state',
      '$env/static/public',
    ]],
    ['solid', [
      'solid-js',
      'solid-js/web',
      '@solidjs/router',
    ]],
    ['angular', [
      '@angular/core',
      'rxjs',
      'rxjs/operators',
    ]],
  ] as const)('leads with every %s group specifier, and with nothing else', (framework, specifiers) => {
    const lines = [...specifiers, 'zod']
      .map((specifier) => {
        return `import '${specifier}';`;
      });

    const [leading, rest] = sortedImports(lines, framework).split('\n\n');

    const leadingLines = leading
      ?.split('\n')
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });
    const expected = lines
      .slice(0, -1)
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });
    expect(leadingLines).toStrictEqual(expected);
    expect(rest).toBe("import 'zod';");
  });

  it('sorts a name before a longer one it prefixes, as simple-import-sort does', () => {
    const sorted = sortedImports([
      "import solid from 'vite-plugin-solid';",
      "import { defineConfig } from 'vite';",
      "import tailwindcss from '@tailwindcss/vite';",
    ]);

    const lines = [
      "import tailwindcss from '@tailwindcss/vite';",
      "import { defineConfig } from 'vite';",
      "import solid from 'vite-plugin-solid';",
    ];
    const expected = lines.join('\n');
    expect(sorted).toBe(expected);
  });

  it('sorts a path segment before a dashed name, and numbers by value, as simple-import-sort does', () => {
    const sorted = sortedImports([
      "import dashed from 'a-b';",
      "import nested from 'a/b';",
      "import ten from 'x10';",
      "import two from 'x2';",
    ]);

    const lines = [
      "import nested from 'a/b';",
      "import dashed from 'a-b';",
      "import two from 'x2';",
      "import ten from 'x10';",
    ];
    const expected = lines.join('\n');
    expect(sorted).toBe(expected);
  });

  it('leaves no trailing blank line where the project imports nothing of its own', () => {
    const actual = sortedImports(["import { defineConfig } from 'vite';"]);
    expect(actual).toBe("import { defineConfig } from 'vite';");
  });
});
