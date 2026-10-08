import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ANSWERS } from '../registry';

import { schemaFor } from './schemaUtils';

interface RequiredKeys {
  required: string[];
}

interface ProjectsSchema {
  items: RequiredKeys;
}

interface SchemaProperties {
  projects: ProjectsSchema;
}

interface GeneratedSchema extends RequiredKeys {
  properties: SchemaProperties;
}

const packageRoot = join(import.meta.dirname, '../../..');
const workspaceRoot = join(packageRoot, '../..');

const copiesOf = async (file: string): Promise<string[]> => {
  const canonical = readFile(join(workspaceRoot, 'schemas', file), 'utf8');
  const packaged = readFile(join(packageRoot, 'templates/schemas', file), 'utf8');

  return Promise.all([canonical, packaged]);
};

describe('schemaFor', () => {
  it('matches both checked-in copies of the v3 schema', async () => {
    const [canonical, packaged] = await copiesOf('linteljs.config.v3.schema.json');
    const generated = schemaFor(ANSWERS);

    expect(canonical).toBe(generated);
    expect(packaged).toBe(generated);
  });

  // Their `$schema` URLs still resolve for v1 and v2 projects.
  it.each(['lintel.config.v1.schema.json', 'linteljs.config.v2.schema.json'])('ships %s unchanged', async (file) => {
    const [canonical, packaged] = await copiesOf(file);

    expect(packaged).toBe(canonical);
  });

  it('excuses only browser and layout from the required list a choice or multi answer otherwise joins', () => {
    const schema = JSON.parse(schemaFor(ANSWERS)) as GeneratedSchema;

    expect(schema.required).not.toContain('browser');
    expect(schema.required).not.toContain('layout');

    const expected = [
      '$schema',
      'schemaVersion',
      'packageManager',
      'typeSafety',
      'agents',
      'plugins',
      'projects',
    ];
    expect(schema.required).toEqual(expected);
    const projectRequired = schema.properties.projects.items.required;
    const expectedProject = [
      'target',
      'testing',
      'libraries',
    ];
    expect(projectRequired).toEqual(expectedProject);
  });
});
