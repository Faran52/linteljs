import {
  describe,
  expect,
  it,
} from 'vitest';

import { sortedImports } from './importUtils';

describe('sortedImports', () => {
  // The order `simple-import-sort` fixes to, so an emitted config passes its own project's first lint.
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

  it('leaves no trailing blank line where the project imports nothing of its own', () => {
    expect(sortedImports(["import { defineConfig } from 'vite';"])).toBe("import { defineConfig } from 'vite';");
  });
});
