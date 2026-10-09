import { globSync } from 'node:fs';
import { posix } from 'node:path';
import { versions } from 'node:process';

import {
  difference,
  maxBy,
  range,
} from 'es-toolkit';

import { projectDirectoryOf } from '@utils/answerUtils';
import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { TEMPLATES_ROOT } from '@disk';
import {
  buildArtifacts,
  seedArtifacts,
  starterSourceEmitter,
  testSetupEmitter,
  workspaceOf,
} from '@emitters';

import {
  type E2eCase,
  type E2eProject,
  everyCase,
  projectsOf,
} from '../matrix/matrix';

import {
  LINTED_FILE,
  NEW_PROJECT,
  STARTER_MIXES,
  STARTER_ROOT,
} from './constants';
import { type Copied, copiedOf } from './utils/copiedUtils';

import type {
  Answers,
  Artifact,
  WorkspaceProject,
} from '@config/types';

export interface StarterCover {
  // Distinct texts a starter template can be written as, per target and destination.
  texts: number;
  uncovered: number;
  // Labels that, added, reach every uncovered text.
  suggested: string[];
  unknown: string[];
  // Lintable starter files no answer set writes.
  unplaced: string[];
}

interface TextClass {
  label: string;
  texts: ReadonlySet<number>;
}

interface Sweep {
  textCount: number;
  classes: TextClass[];
  classOf: Map<string, TextClass>;
  placed: Set<string>;
}

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

const writtenFor = (answers: Answers): Copied[] => {
  const written = writtenOf([...starterSourceEmitter(answers), ...testSetupEmitter(answers, NEW_PROJECT)]);

  return written
    .flatMap(copiedOf)
    .filter(({ target }) => {
      return LINTED_FILE.test(target);
    });
};

const signatureOf = (copied: Copied[]): string => {
  return copied
    .map(({ target, sources }) => {
      return `${target}=${sources.join('+')}`;
    })
    .join('\n');
};

const allCases = (): E2eCase[] => {
  return keysOf(ANSWERS.target.values)
    .flatMap(everyCase);
};

const buildSweep = (): Sweep => {
  const textIds = new Map<string, number>();
  const bySignature = new Map<string, TextClass>();
  const sweep: Sweep = {
    textCount: 0,
    classes: [],
    classOf: new Map(),
    placed: new Set(),
  };

  const idOf = (key: string): number => {
    const known = textIds.get(key) ?? textIds.size;

    textIds.set(key, known);

    return known;
  };

  const classFor = (item: E2eCase, copied: Copied[]): TextClass => {
    const keyOf = (file: Copied): number => {
      for (const source of file.sources) {
        sweep.placed.add(source);
      }

      const text = file.text();

      return idOf(`${item.answers.target}\n${file.target}\n${text}`);
    };

    const ids = copied.map(keyOf);
    const texts = new Set(ids);
    const made = {
      label: item.label,
      texts,
    };

    sweep.classes.push(made);

    return made;
  };

  for (const item of allCases()) {
    const copied = writtenFor(item.answers);
    const written = signatureOf(copied);
    const signature = `${item.answers.target}\n${written}`;
    const found = bySignature.get(signature) ?? classFor(item, copied);

    bySignature.set(signature, found);
    sweep.classOf.set(item.label, found);
  }

  sweep.textCount = textIds.size;

  return sweep;
};

const swept: Sweep[] = [];

const sweepOnce = (): Sweep => {
  const sweep = swept[0] ?? buildSweep();

  swept[0] = sweep;

  return sweep;
};

// Greedy: the class reaching the most uncovered texts, until none is left.
export const greedyLabels = (classes: TextClass[], uncovered: Set<number>): string[] => {
  const remaining = new Set(uncovered);
  const picked: string[] = [];

  const reach = (item: TextClass): number => {
    const texts = [...item.texts];

    return texts
      .filter((text) => {
        return remaining.has(text);
      }).length;
  };

  // A text no class reaches would otherwise pick a class that removes nothing, forever.
  while (remaining.size > 0) {
    const reaching = classes
      .filter((item) => {
        return reach(item) > 0;
      });
    const best = maxBy(reaching, reach);

    if (best === undefined) {
      break;
    }

    picked.push(best.label);

    for (const text of best.texts) {
      remaining.delete(text);
    }
  }

  return picked;
};

const unplacedOf = (placed: Set<string>): string[] => {
  const options = { cwd: TEMPLATES_ROOT };

  return globSync(`${STARTER_ROOT}/**/*`, options)
    .filter((path) => {
      return LINTED_FILE.test(path) && !placed.has(path);
    });
};

export const starterCover = (labels: readonly string[]): StarterCover => {
  const sweep = sweepOnce();
  const found = labels
    .flatMap((label) => {
      const item = sweep.classOf.get(label);
      const known = item === undefined ? [] : [item];

      return known;
    });
  const unknown = labels
    .filter((label) => {
      return !sweep.classOf.has(label);
    });
  const reached = found
    .flatMap((item) => {
      const texts = [...item.texts];

      return texts;
    });
  const missed = difference(range(sweep.textCount), reached);
  const uncovered = new Set(missed);

  const cover: StarterCover = {
    texts: sweep.textCount,
    uncovered: uncovered.size,
    suggested: greedyLabels(sweep.classes, uncovered),
    unknown,
    unplaced: unplacedOf(sweep.placed),
  };

  return cover;
};

// Without the sweep, so the lint tool pays only for the enumeration.
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

const targetsOf = (artifacts: Artifact[]): string[] => {
  return writtenOf(artifacts)
    .map(({ target }) => {
      return target;
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

const hostedOf = (project: E2eProject): WorkspaceProject => {
  const answers = {
    ...project.answers,
    nodeVersion: versions.node,
  };
  const hosted: WorkspaceProject = {
    ...project,
    answers,
  };

  return hosted;
};

// A starter file or suite one project writes alone that its monorepo leaves out of the project's directory.
export const unsuitedOf = (item: E2eCase, name: string): string[] => {
  const [first, ...rest] = projectsOf(item, name);
  const workspace = workspaceOf(name, [hostedOf(first), ...rest.map(hostedOf)]);
  const written = new Set(targetsOf([...seedArtifacts(workspace), ...buildArtifacts(workspace)]));

  return workspace.projects
    .flatMap(({ answers, name: projectName }) => {
      const directory = projectDirectoryOf(answers, projectName);
      const starters = starterSourceEmitter(answers);

      return targetsOf(starters)
        .map((target) => {
          return posix.join(directory, target);
        });
    })
    .filter((target) => {
      return !written.has(target);
    });
};
