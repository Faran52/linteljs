import { globSync } from 'node:fs';

import {
  difference,
  maxBy,
  range,
} from 'es-toolkit';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { TEMPLATES_ROOT } from '@disk';
import { starterSourceEmitter, testSetupEmitter } from '@emitters';

import { type E2eCase, everyCase } from '../matrix/matrix';

import {
  LINTED_FILE,
  NEW_PROJECT,
  STARTER_ROOT,
} from './constants';
import { type Copied, copiedOf } from './utils/copiedUtils';

import type { Answers, Artifact } from '@config/types';

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
  return valuesOf(ANSWERS.target.values)
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
const greedyLabels = (classes: TextClass[], uncovered: Set<number>): string[] => {
  const remaining = new Set(uncovered);
  const picked: string[] = [];

  const reach = (item: TextClass): number => {
    const texts = [...item.texts];

    return texts
      .filter((text) => {
        return remaining.has(text);
      }).length;
  };

  // Every text belongs to a class, so a class is left while a text is.
  while (remaining.size > 0) {
    const best = maxBy(classes, reach);

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
