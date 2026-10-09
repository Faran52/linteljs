import {
  describe,
  expect,
  it,
} from 'vitest';

import { projectDirectoryOf } from '@utils/answerUtils';

import { DEFAULT_ANSWERS } from '@answers';
import { starterSourceEmitter } from '@emitters';

import { STARTER_CASES, STARTER_MIXES } from './constants';
import {
  greedyLabels,
  starterCases,
  starterCover,
  starterMixes,
  unsuitedOf,
  writtenOf,
} from './starterCover';

import type { Answers } from '@config/types';

const NOT_A_CASE = 'react pnpm vitest no-such-answer';

const PACKAGE_CASE = 'typescript pnpm vitest zod+es-toolkit+ts-pattern+t3-env';

describe('starterCover', () => {
  // Every case renders every starter: about 5s plain, past the 30s default once Stryker instruments it on CI.
  it('reaches every starter text from the committed cases', () => {
    const cover = starterCover(STARTER_CASES);
    const toAdd = `add to STARTER_CASES:\n${cover.suggested.join('\n')}`;

    expect(cover.uncovered, toAdd).toBe(0);
    expect(cover.unknown).toStrictEqual([]);
    expect(cover.unplaced).toStrictEqual([]);
    expect(cover.suggested).toStrictEqual([]);
  }, 120_000);

  it('suggests cases that reach what no case reaches', () => {
    const cover = starterCover([]);
    const again = starterCover(cover.suggested);

    expect(cover.texts).toBeGreaterThan(0);
    expect(cover.uncovered).toBe(cover.texts);
    expect(again.uncovered).toBe(0);
  });

  it('suggests what reaches a text and stops at one no class reaches', () => {
    const classes = [{
      label: 'reaches',
      texts: new Set([0]),
    }];
    const uncovered = new Set([0, 1]);
    const suggested = greedyLabels(classes, uncovered);

    expect(suggested).toStrictEqual(['reaches']);
  });

  it('names a label no case carries', () => {
    const labels = [NOT_A_CASE];
    const cover = starterCover(labels);

    expect(cover.unknown).toStrictEqual(labels);
  });
});

describe('starterCases', () => {
  it('answers each committed label with its case, dropping one it does not know', () => {
    const labels = [...STARTER_CASES, NOT_A_CASE];
    const cases = starterCases(labels);
    const caseLabels = cases
      .map(({ label }) => {
        return label;
      });

    expect(caseLabels).toStrictEqual(STARTER_CASES);
  });
});

describe('writtenOf', () => {
  it('drops a starter test whose covered file is not written', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'react',
      testing: 'vitest',
      router: 'react-router-framework',
    };
    const artifacts = starterSourceEmitter(answers);
    const targets = writtenOf(artifacts)
      .map(({ target }) => {
        return target;
      });

    expect(targets).not.toContain('src/components/features/error-boundary/ErrorBoundary.test.tsx');
    expect(targets).toContain('src/components/features/route-error/RouteError.test.tsx');
  });
});

describe('starterMixes', () => {
  it('reads each committed mix as a monorepo of its cases', () => {
    const shapes = starterMixes(STARTER_MIXES)
      .map(({ label, projects = [] }) => {
        const directories = projects
          .map(({ name, answers }) => {
            return projectDirectoryOf(answers, name);
          });

        return `${label}: ${directories.join(' ')}`;
      });

    expect(shapes).toStrictEqual([
      'react+vue+package monorepo: apps/web apps/site packages/core',
      'react+react monorepo: apps/web apps/admin',
      'package+package monorepo: packages/core packages/utils',
    ]);
  });

  it('drops a mix with a label no case carries', () => {
    const mixes = starterMixes([['broken', [['core', PACKAGE_CASE], ['web', NOT_A_CASE]]]]);

    expect(mixes).toStrictEqual([]);
  });
});

describe('unsuitedOf', () => {
  it('finds every starter file and suite of each mix in its project directory', () => {
    const unsuited = starterMixes(STARTER_MIXES)
      .flatMap((mix) => {
        return unsuitedOf(mix, 'starter');
      });

    expect(unsuited).toStrictEqual([]);
  }, 60_000);
});
