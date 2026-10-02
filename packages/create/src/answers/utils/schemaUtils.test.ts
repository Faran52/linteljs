import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ANSWERS } from '../registry';

import { schemaFor } from './schemaUtils';

interface GeneratedSchema {
  required: string[];
}

describe('schemaFor', () => {
  it('matches both checked-in copies of the v2 schema', async () => {
    const packageRoot = join(import.meta.dirname, '../../..');
    const workspaceRoot = join(packageRoot, '../..');
    const canonicalPath = join(workspaceRoot, 'schemas/linteljs.config.v2.schema.json');
    const packagedPath = join(packageRoot, 'templates/schemas/linteljs.config.v2.schema.json');
    const [canonical, packaged] = await Promise.all([
      readFile(canonicalPath, 'utf8'),
      readFile(packagedPath, 'utf8'),
    ]);

    const generated = schemaFor(ANSWERS);

    expect(canonical).toBe(generated);
    expect(packaged).toBe(generated);
  });

  it('excuses only browser from the required list a choice or multi answer otherwise joins', () => {
    const schema = JSON.parse(schemaFor(ANSWERS)) as GeneratedSchema;

    expect(schema.required).not.toContain('browser');

    const expected = [
      '$schema',
      'schemaVersion',
      'target',
      'testing',
      'packageManager',
      'libraries',
      'typeSafety',
      'agents',
      'plugins',
    ];
    expect(schema.required).toEqual(expected);
  });
});
