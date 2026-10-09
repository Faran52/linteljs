import { expect, it } from 'vitest';

import { packageJsonWriter } from './packageJsonWriter';

it('keeps the fields, scripts in order, dependencies sorted and empty sections out', () => {
  const text = packageJsonWriter({
    name: 'demo',
    scripts: {
      dev: 'vite',
      build: 'vite build',
    },
    dependencies: {
      zod: '^4.0.0',
      react: '^19.0.0',
    },
    devDependencies: {},
  });
  const manifest = {
    name: 'demo',
    scripts: {
      dev: 'vite',
      build: 'vite build',
    },
    dependencies: {
      react: '^19.0.0',
      zod: '^4.0.0',
    },
  };
  const expected = `${JSON.stringify(manifest, null, 2)}\n`;

  expect(text).toBe(expected);
});
