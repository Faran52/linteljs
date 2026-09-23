/**
 * Marks `dist/` as CommonJS, so `dist/index.js` is read as CJS despite this package's `"type": "module"`. The CJS
 * half has to be named `.js` rather than `.cjs`, because ESLint 5's config loader switches on the extension and
 * knows only `.js`, `.json`, `.yaml` and `.yml`: a `.cjs` main falls to its YAML branch, so
 * `extends: ["plugin:@linteljs/recommended"]` reads the bundle as YAML and dies on the second line.
 * `scripts/compatMatrix.ts` proves this, and the published 1.0.3 fails it. A three-line file rather than a build
 * plugin: this is the whole of what the trick needs, and it runs from `build` so a plain `tsdown` can never leave
 * `dist/` half-configured.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist');

writeFileSync(join(dist, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

console.log('  ✓ dist/package.json marks the bundle CommonJS');
