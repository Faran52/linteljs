import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { TEMPLATES_ROOT } from '@disk';

import { FRAMEWORKS } from './registry';

it('names only frameworks with a templates module', () => {
  const missing = FRAMEWORKS
    .filter((name) => {
      const module = join(TEMPLATES_ROOT, 'frameworks', name);

      return !existsSync(module);
    });

  expect(missing).toEqual([]);
});
