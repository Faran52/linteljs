import { expect, it } from 'vitest';

import { CONFIG_SCHEMA_URL } from '@answers';

import { configRecord } from './configRecord';

it('records the workspace answers once and each project under projects, defaults filled', () => {
  const text = configRecord([
    {
      name: 'web',
      answers: {
        target: 'react',
        layout: 'monorepo',
        agents: ['claude-code'],
      },
    },
    {
      name: 'lib',
      answers: {
        target: 'typescript',
        layout: 'monorepo',
      },
    },
  ]);
  const parsed: unknown = JSON.parse(text);

  const closed = text.endsWith('}\n');

  expect(closed).toBe(true);

  expect(parsed).toMatchObject({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: 2,
    layout: 'monorepo',
    agents: ['claude-code'],
    projects: [
      {
        name: 'web',
        target: 'react',
      },
      {
        name: 'lib',
        target: 'typescript',
        testing: 'vitest',
      },
    ],
  });
});

it('leaves an optional choice answered none unrecorded, and keeps a choice whose value is none', () => {
  const text = configRecord([{
    name: 'app',
    answers: {
      target: 'react',
      form: 'none',
      testing: 'none',
    },
  }]);
  const parsed: unknown = JSON.parse(text);

  expect(parsed).not.toHaveProperty([
    'projects',
    0,
    'form',
  ]);

  expect(parsed).toHaveProperty([
    'projects',
    0,
    'testing',
  ], 'none');
});

it('throws on a record the config reader refuses', () => {
  const recording = (): string => {
    return configRecord([{
      name: 'app',
      answers: { target: 'cobol' },
    }]);
  };

  expect(recording).toThrow(/target/u);
});
