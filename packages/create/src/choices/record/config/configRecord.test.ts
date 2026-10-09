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

it('throws on a record the config reader refuses', () => {
  const recording = (): string => {
    return configRecord([{
      name: 'app',
      answers: { target: 'cobol' },
    }]);
  };

  expect(recording).toThrow(/target/u);
});
