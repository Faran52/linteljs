import { hostedAnswersFor } from '@mocks/answersFor';

import { ANSWERS } from '@answers';

import {
  answerRows,
  gateRows,
  stackRows,
} from './recordUtils';

const VERSIONS = {
  '@linteljs/eslint-config': '^2.0.0',
  'react': '^19.3.0',
  'typescript': '~5.9.3',
};

describe('stackRows', () => {
  it('states the version as recorded, without the range it was written with, in the order a reader wants', () => {
    expect(stackRows(hostedAnswersFor({ packageManagerVersion: '12.4.1' }), VERSIONS)).toEqual([
      ["name: 'linteljs'", "version: '2.0.0'"],
      ["name: 'react'", "version: '19.3.0'"],
      ["name: 'typescript'", "version: '5.9.3'"],
      ["name: 'node'", "version: '26.9.0'"],
      ["name: 'pnpm'", "version: '12.4.1'"],
    ]);
  });

  it('prints no framework row for a target that renders with none', () => {
    expect(stackRows(hostedAnswersFor({ target: 'webextension' }), VERSIONS)).toEqual([
      ["name: 'linteljs'", "version: '2.0.0'"],
      ["name: 'typescript'", "version: '5.9.3'"],
      ["name: 'node'", "version: '26.9.0'"],
    ]);
  });

  it('strips only a leading range sigil from a recorded version', () => {
    expect(stackRows(hostedAnswersFor({ target: 'webextension' }), {
      '@linteljs/eslint-config': 'workspace:^',
      'typescript': '5.9.3',
    })).toContainEqual(["name: 'linteljs'", "version: 'workspace:^'"]);
  });

  it('reads no framework version for a target that renders with none', () => {
    expect(stackRows(hostedAnswersFor({ target: 'webextension' }), { undefined: '1.0.0' }))
      .toEqual([["name: 'node'", "version: '26.9.0'"]]);
  });

  it('leaves out a row whose version is unknown', () => {
    expect(stackRows(hostedAnswersFor(), {})).toEqual([["name: 'node'", "version: '26.9.0'"]]);
  });
});

describe('gateRows', () => {
  it('prints what each leg of check runs for the target, not what another target runs', () => {
    const rows = gateRows(hostedAnswersFor({
      target: 'react-native',
      testing: 'none',
    }));

    expect(rows).toEqual([
      ["command: 'pnpm lint'", "runs: 'eslint .'"],
      ["command: 'pnpm lint:types'", "runs: 'node scripts/checkBannedPatterns.ts src'"],
      ["command: 'pnpm lint:css'", "runs: 'stylelint \"src/**/*.css\" --allow-empty-input'"],
      ["command: 'pnpm typecheck'", "runs: 'tsc --noEmit'"],
      ["command: 'pnpm build'", "runs: 'expo export'"],
    ]);
  });
});

describe('answerRows', () => {
  it('prints the answers a prompt asked, and nothing else', () => {
    expect(answerRows(hostedAnswersFor({ store: 'zustand' }), ANSWERS)).toEqual([
      ["label: 'Framework'", "value: 'react'"],
      ["label: 'Browser'", "value: 'chrome'"],
      ["label: 'Testing'", "value: 'vitest'"],
      ["label: 'Libraries'", "value: 'es-toolkit'"],
      ["label: 'State store'", "value: 'zustand'"],
      ["label: 'Type safety'", "value: 'strict'"],
      ["label: 'AI agents'", "value: 'claude-code'"],
      ["label: 'AI plugins'", "value: 'ponytail, context7, frontend-design'"],
    ]);
  });

  it('prints a list answer joined, and no row for an empty one', () => {
    const label = `label: '${ANSWERS.agents.prompt}'`;

    expect(answerRows(hostedAnswersFor({ agents: ['codex', 'cursor'] }), ANSWERS)).toContainEqual([
      label,
      "value: 'codex, cursor'",
    ]);
    const labels = answerRows(hostedAnswersFor({ agents: [] }), ANSWERS)
      .map(([row]) => {
        return row;
      });

    expect(labels).not.toContain(label);
  });

  it('prints nothing for an answer no prompt asks', () => {
    const rows = answerRows(hostedAnswersFor({ aliases: { '@app/*': './src/*' } }), ANSWERS);

    const noneScoped = rows
      .every(([label]) => {
        return !label.includes('@app');
      });

    expect(noneScoped).toBe(true);
  });
});
