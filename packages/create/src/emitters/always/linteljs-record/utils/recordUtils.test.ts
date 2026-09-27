import { hostedAnswersFor } from '@mocks/answersFor';

import { ANSWERS } from '@answers';

import { answerRows, stackRows } from './recordUtils';

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

  // The extension hosting nothing is the case: there is no framework to name, so no row is printed for one.
  it('prints no framework row for a target that renders with none', () => {
    expect(stackRows(hostedAnswersFor({ target: 'webextension' }), VERSIONS)).toEqual([
      ["name: 'linteljs'", "version: '2.0.0'"],
      ["name: 'typescript'", "version: '5.9.3'"],
      ["name: 'node'", "version: '26.9.0'"],
    ]);
  });

  // A version this table does not carry is left out rather than printed empty, and so is a manager never recorded.
  it('leaves out a row whose version is unknown', () => {
    expect(stackRows(hostedAnswersFor(), {})).toEqual([["name: 'node'", "version: '26.9.0'"]]);
  });
});

describe('answerRows', () => {
  // `packageManager` holds a string no prompt asked for, so a row with no label would print for it.
  it('prints the answers a prompt asked, and nothing else', () => {
    expect(answerRows(hostedAnswersFor({ store: 'zustand' }), ANSWERS)).toEqual([
      ["label: 'Framework'", "value: 'react'"],
      // Every config holds a browser, since the key is required; a slot decides the question, not the row.
      ["label: 'Browser'", "value: 'chrome'"],
      ["label: 'Testing'", "value: 'vitest'"],
      ["label: 'Libraries'", "value: 'es-toolkit'"],
      ["label: 'State store'", "value: 'zustand'"],
      ["label: 'Type safety'", "value: 'strict'"],
      ["label: 'AI agents'", "value: 'claude-code'"],
      ["label: 'AI plugins'", "value: 'ponytail, context7, frontend-design'"],
    ]);
  });

  // An empty list is an answer of nothing, so it prints no row rather than an empty value.
  it('prints a list answer joined, and no row for an empty one', () => {
    const label = `label: '${ANSWERS.agents.prompt}'`;

    expect(answerRows(hostedAnswersFor({ agents: ['codex', 'cursor'] }), ANSWERS)).toContainEqual([
      label,
      "value: 'codex, cursor'",
    ]);
    expect(answerRows(hostedAnswersFor({ agents: [] }), ANSWERS).map(([row]) => {
      return row;
    })).not.toContain(label);
  });

  // `aliases` is a map and carries no prompt, so a page never has to render one.
  it('prints nothing for an answer no prompt asks', () => {
    const rows = answerRows(hostedAnswersFor({ aliases: { '@app/*': './src/*' } }), ANSWERS);

    expect(rows.every(([label]) => {
      return !label.includes('@app');
    })).toBe(true);
  });
});
