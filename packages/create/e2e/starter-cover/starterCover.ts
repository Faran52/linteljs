import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import {
  type E2eCase,
  type E2eProject,
  everyCase,
} from '../matrix/matrix';

import type { Artifact } from '@config/types';
import type { STARTER_MIXES } from './constants';

// A starter test is written only beside the file it covers, as `artifactWriter` skips it otherwise.
export const writtenOf = (artifacts: Artifact[]): Artifact[] => {
  const paths = artifacts
    .map(({ target }) => {
      return target;
    });
  const targets = new Set(paths);

  return artifacts
    .filter(({ requires = [] }) => {
      return requires
        .every((path) => {
          return targets.has(path);
        });
    });
};

const allCases = (): E2eCase[] => {
  return keysOf(ANSWERS.target.values)
    .flatMap(everyCase);
};

export const starterCases = (labels: readonly string[]): E2eCase[] => {
  const pairs = allCases()
    .map((item) => {
      const pair: [string, E2eCase] = [item.label, item];

      return pair;
    });
  const byLabel = new Map(pairs);

  return labels
    .flatMap((label) => {
      const found = byLabel.get(label);
      const known = found === undefined ? [] : [found];

      return known;
    });
};

// Each mix whose every label names a case, as a monorepo of those cases.
export const starterMixes = (mixes: typeof STARTER_MIXES): E2eCase[] => {
  return mixes
    .flatMap(([label, named]) => {
      const projects = named
        .flatMap(([name, caseLabel]) => {
          return starterCases([caseLabel])
            .map(({ answers }): E2eProject => {
              const project: E2eProject = {
                name,
                answers: {
                  ...answers,
                  layout: 'monorepo',
                },
              };

              return project;
            });
        });
      const [first, ...rest] = projects;
      const whole = first !== undefined && projects.length === named.length;
      const mix: E2eCase[] = whole
        ? [{
            label: `${label} monorepo`,
            answers: first.answers,
            variant: 'monorepo',
            projects: [first, ...rest],
          }]
        : [];

      return mix;
    });
};
