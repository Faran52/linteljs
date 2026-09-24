import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';

import {
  ANSWERS,
  type Answers,
  type HostedAnswers,
} from '@answers';

import { answerRows, stackRows } from './recordUtils';

const answersFor = (overrides: Partial<Answers> = {}): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

const VERSIONS = {
  '@linteljs/eslint-config': '^1.6.0',
  'react': '^19.3.0',
  'typescript': '~5.9.3',
};

describe('stackRows', () => {
  it('states the version as recorded, without the range it was written with', () => {
    expect(stackRows(answersFor(), VERSIONS)).toContainEqual([
      "name: 'linteljs'",
      "version: '1.6.0'",
    ]);
    expect(stackRows(answersFor(), VERSIONS)).toContainEqual([
      "name: 'typescript'",
      "version: '5.9.3'",
    ]);
  });

  // The extension hosting nothing is the case: there is no framework to name, so no row is printed for one.
  it('prints no framework row for a target that renders with none', () => {
    const rows = stackRows(answersFor({ target: 'webextension' }), VERSIONS);

    expect(rows.map(([name]) => {
      return name;
    })).not.toContain("name: 'react'");
  });

  // A version this table does not carry is left out rather than printed empty.
  it('leaves out a row whose version is unknown', () => {
    expect(stackRows(answersFor(), {}).map(([name]) => {
      return name;
    })).not.toContain("name: 'linteljs'");
  });
});

describe('answerRows', () => {
  it('prints an answer a prompt asked', () => {
    expect(answerRows(answersFor({ store: 'zustand' }), ANSWERS)).toContainEqual([
      "label: 'State store'",
      "value: 'zustand'",
    ]);
  });

  // `aliases` is a map and carries no prompt, so a page never has to render one.
  it('prints nothing for an answer no prompt asks', () => {
    const rows = answerRows(answersFor({ aliases: { '@app/*': './src/*' } }), ANSWERS);

    expect(rows.every(([label]) => {
      return !label.includes('@app');
    })).toBe(true);
  });
});
