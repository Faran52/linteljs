import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ANSWERS } from '../registry';

import { schemaFor } from './schemaUtils';

import type { TargetRecord } from '@targets';
import type { OptionalChoiceRecord } from '../types';

interface RequiredKeys {
  required: string[];
}

interface TargetConst {
  const: string;
}

interface TargetProperty {
  target: TargetConst;
}

interface TargetIf {
  properties: TargetProperty;
}

interface TargetCondition {
  if: TargetIf;
}

interface ProjectItems extends RequiredKeys {
  allOf: TargetCondition[];
}

interface ProjectsSchema {
  items: ProjectItems;
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
  it('matches both checked-in copies of the v2 schema', async () => {
    const [canonical, packaged] = await copiesOf('linteljs.config.v2.schema.json');
    const generated = schemaFor(ANSWERS);

    expect(canonical).toBe(generated);
    expect(packaged).toBe(generated);
  });

  // Its `$schema` URL still resolves for v1 projects.
  it('ships the v1 schema unchanged', async () => {
    const [canonical, packaged] = await copiesOf('lintel.config.v1.schema.json');

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

  it('derives the project refusals from the records it is given', () => {
    const answers = {
      ...ANSWERS,
      e2e: {
        key: 'e2e',
        kind: 'optionalChoice',
        none: { label: 'None' },
        values: { playwright: { label: 'Playwright' } },
      } satisfies OptionalChoiceRecord,
      stories: {
        ...ANSWERS.stories,
        slot: (target: TargetRecord) => {
          return target.astro !== true || target.framework !== 'solid';
        },
      },
    };
    const schema = JSON.parse(schemaFor(answers)) as GeneratedSchema;

    const refusals = schema.properties.projects.items.allOf;
    const expected = [
      {
        if: {
          required: ['hostedFramework'],
          properties: {
            target: { const: 'astro' },
            hostedFramework: {
              not: {
                enum: [
                  'react',
                  'vue',
                  'svelte',
                ],
              },
            },
          },
        },
        then: { not: { required: ['stories'] } },
      },
    ];
    expect(refusals).toEqual(expected);
  });
});
