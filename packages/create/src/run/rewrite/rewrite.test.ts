import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '../../model/answers/answers';

import {
  guardMountLookups,
  markTypeOnlyImports,
  rewriteScaffoldedSource,
  sourceFiles,
  stripTsExtensions,
} from './rewrite';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-rewrite-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

// The generator's own output, planted at the paths a generator would have written it to.
const scaffold = async (files: Record<string, string>): Promise<void> => {
  for (const [path, body] of Object.entries(files)) {
    await mkdir(join(cwd, path, '..'), { recursive: true });
    await writeFile(join(cwd, path), body, 'utf8');
  }
};

// A record is built from answers now, so a test naming only a target still hands over a whole set.
const answersFor = (target: TargetId): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target,
  };
};

describe('sourceFiles', () => {
  it('reads a missing root as nothing to rewrite', async () => {
    await expect(sourceFiles(join(cwd, 'src'))).resolves.toEqual([]);
  });

  // Only absence is data; anything else stays an error.
  it('rethrows a failure that is not absence', async () => {
    await scaffold({ src: '' });

    await expect(sourceFiles(join(cwd, 'src'))).rejects.toThrow();
  });
});

describe('stripTsExtensions', () => {
  it('drops the extension from the imports every vite template writes', () => {
    expect(stripTsExtensions("import App from './App.tsx'\n"))
      .toBe("import App from './App'\n");
    expect(stripTsExtensions("import { setupCounter } from './counter.ts';"))
      .toBe("import { setupCounter } from './counter';");
    expect(stripTsExtensions("import './register.ts';")).toBe("import './register';");
    expect(stripTsExtensions("export { x } from '../lib/x.mts';"))
      .toBe("export { x } from '../lib/x';");
    expect(stripTsExtensions("await import('./late.tsx');")).toBe("await import('./late');");
  });

  it('leaves everything that is not a relative ts import alone', () => {
    const untouched = [
      "import viteLogo from './assets/vite.svg';",
      "import App from './App.vue';",
      "import App from './App.svelte';",
      "import type { X } from './types.d.ts';",
      "import { z } from 'zod';",
      "const label = './App.tsx';",
    ].join('\n');

    expect(stripTsExtensions(untouched)).toBe(untouched);
  });
});

describe('markTypeOnlyImports', () => {
  const typeOnly = {
    '@angular/core': ['ApplicationConfig'],
    '@angular/router': ['Routes'],
  };

  it('marks the type in a clause that also imports values', () => {
    expect(markTypeOnlyImports(
      "import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';",
      typeOnly,
    )).toBe(
      "import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';",
    );
  });

  it('leaves an unlisted module and an already-marked specifier alone', () => {
    // A module with no entry at all, rather than a listed one whose specifiers happen not to
    // match: the two take different paths and only the first proves the lookup is consulted.
    const unlisted = "import { Component } from '@angular/common';";
    const valueFromAListedModule = "import { provideRouter } from '@angular/router';";
    const marked = "import { type Routes } from '@angular/router';";

    expect(markTypeOnlyImports(unlisted, typeOnly)).toBe(unlisted);
    expect(markTypeOnlyImports(valueFromAListedModule, typeOnly)).toBe(valueFromAListedModule);
    expect(markTypeOnlyImports(marked, typeOnly)).toBe(marked);
  });
});

describe('rewriteScaffoldedSource', () => {
  it('rewrites the scaffolder source and reports only what it changed', async () => {
    const written: string[] = [];

    await mkdir(join(cwd, 'src/nested'), { recursive: true });
    await writeFile(join(cwd, 'src/main.tsx'), "import App from './App.tsx';\n", 'utf8');
    await writeFile(join(cwd, 'src/nested/keep.ts'), "import { z } from 'zod';\n", 'utf8');

    await rewriteScaffoldedSource(cwd, answersFor('react'), (path) => {
      written.push(path);
    });

    expect(await readFile(join(cwd, 'src/main.tsx'), 'utf8')).toBe("import App from './App';\n");
    expect(written).toEqual(['src/main.tsx']);
  });

  it('applies the angular type-import fix on top of the extension strip', async () => {
    await mkdir(join(cwd, 'src/app'), { recursive: true });
    await writeFile(
      join(cwd, 'src/app/app.routes.ts'),
      "import { Routes } from '@angular/router';\n\nimport './guards.ts';\n",
      'utf8',
    );

    await rewriteScaffoldedSource(cwd, answersFor('angular'));

    expect(await readFile(join(cwd, 'src/app/app.routes.ts'), 'utf8'))
      .toBe("import { type Routes } from '@angular/router';\n\nimport './guards';\n");
  });

  it('treats a project with no src directory as nothing to do', async () => {
    await expect(rewriteScaffoldedSource(cwd, answersFor('react'))).resolves.toBeUndefined();
  });
});

/**
 * The three mount shapes `pnpm create vite` emits: React and vanilla assert inline, Solid hoists
 * and asserts at the use site. Vue mounts by selector string, Svelte and Next have no mount file,
 * and Angular bootstraps through `bootstrapApplication`, so none of those need guarding.
 */
const REACT_ENTRY = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`;

const SOLID_ENTRY = `/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')

render(() => <App />, root!)
`;

const PLAIN_ENTRY = `import './style.css'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = \`
  <button id="counter" type="button"></button>
\`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
`;

describe('guardMountLookups', () => {
  it('hoists and guards react\'s inline mount lookup', () => {
    const output = guardMountLookups(REACT_ENTRY);

    expect(output).toContain("const root = document.getElementById('root');");
    expect(output).toContain("throw new Error('Element #root not found');");
    expect(output).toContain('createRoot(root).render(');
    // The guard bodies contain `!`, so the assertion syntax is what has to be gone.
    expect(output).not.toMatch(/\)!|\broot!/);
  });

  it("guards solid's already-hoisted binding without re-declaring it", () => {
    const output = guardMountLookups(SOLID_ENTRY);

    expect(output).toContain("const root = document.getElementById('root')\n\nif (!root) {");
    expect(output).toContain("throw new Error('Element #root not found');");
    expect(output).toContain('render(() => <App />, root)');
    expect(output.match(/const root =/g)).toHaveLength(1);
  });

  it('guards both of the lookups vanilla asserts on', () => {
    const output = guardMountLookups(PLAIN_ENTRY);

    expect(output).toContain("const app = document.querySelector<HTMLDivElement>('#app');");
    expect(output).toContain("throw new Error('Element #app not found');");
    expect(output).toContain('app.innerHTML =');
    expect(output).toContain("const counter = document.querySelector<HTMLButtonElement>('#counter');");
    expect(output).toContain("throw new Error('Element #counter not found');");
    expect(output).toContain('setupCounter(counter)');
    expect(output).not.toMatch(/\)!/);
  });

  // The hoisted shape with `querySelector` instead of `getElementById`: reading the method off the wrong half of the
  // matched pair is how a guard ends up naming `##app`.
  it('guards an already-hoisted querySelector without inventing a hash', () => {
    const output = guardMountLookups("const app = document.querySelector('#app');\n\napp!.replaceChildren();\n");

    expect(output).toContain("throw new Error('Element #app not found');");
    expect(output).toContain('app.replaceChildren();');
    expect(output).not.toContain('##app');
  });

  it('names the selector it looked for, so the runtime failure explains itself', () => {
    expect(guardMountLookups("x(document.getElementById('mount')!)"))
      .toContain("throw new Error('Element #mount not found');");
    expect(guardMountLookups("x(document.querySelector('.app')!)"))
      .toContain("throw new Error('Element .app not found');");
  });

  it('is idempotent, because a re-run sees the shape it produced', () => {
    // `--skip-scaffold` runs this over its own already-guarded output, so a second guard landing
    // where the binding is already narrowed would fail `no-unnecessary-condition`.
    for (const entry of [REACT_ENTRY, SOLID_ENTRY, PLAIN_ENTRY]) {
      const once = guardMountLookups(entry);

      expect(guardMountLookups(once)).toBe(once);
      expect(guardMountLookups(guardMountLookups(once))).toBe(once);
    }
  });

  it('leaves a shape it does not recognise exactly as it was', () => {
    const untouched = [
      'const el = getRoot()!;',
      'const value = map.get(key)!;',
      'const x = document.getElementById(name)!;',
      'app.mount(\'#app\')',
      'bootstrapApplication(App, appConfig);',
    ].join('\n');

    expect(guardMountLookups(untouched)).toBe(untouched);
  });

  it('only rewrites the mount entry, never the rest of a retrofitted tree', async () => {
    const source = join(cwd, 'src');
    const nested = join(source, 'lib');

    await mkdir(nested, { recursive: true });
    await writeFile(join(source, 'main.ts'), PLAIN_ENTRY, 'utf8');
    await writeFile(join(nested, 'dom.ts'), "export const el = document.getElementById('x')!;\n", 'utf8');

    await rewriteScaffoldedSource(cwd, answersFor('webextension'));

    expect(await readFile(join(source, 'main.ts'), 'utf8')).toContain('if (!app) {');
    expect(await readFile(join(nested, 'dom.ts'), 'utf8'))
      .toBe("export const el = document.getElementById('x')!;\n");
  });
});
