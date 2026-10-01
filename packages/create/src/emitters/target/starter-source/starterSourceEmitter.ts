import { posix } from 'node:path';

import {
  type Answers,
  type Artifact,
  type TargetId,
} from '@config/types';

import { hasTests } from '@utils/answerUtils';

import {
  type StarterFile,
  type StarterTest,
  targetFor,
} from '@targets';

import {
  CODE_EXTENSION,
  NOT_DOTTED,
  RELATIVE_SPECIFIER,
} from './constants';

type Starter = StarterFile | StarterTest;

const applies = (file: Starter, answers: Answers): boolean => {
  return file.when === undefined || file.when(answers);
};

const rootOf = (id: TargetId, shared: true | TargetId | undefined): string => {
  if (shared === undefined) {
    return id;
  }

  return shared === true ? 'shared' : shared;
};

const sourceOf = (id: TargetId, file: Starter): string => {
  const asset = file.source ?? file.target;

  return [
    'starter-source',
    rootOf(id, file.shared),
    file.variant,
    asset,
  ]
    .filter(Boolean)
    .join('/');
};

const stem = (path: string): string => {
  return path.replace(CODE_EXTENSION, '');
};

// Asset stem to written stem, for each file this project writes under another name than its asset's.
const renamesOf = (files: Starter[]): Map<string, string> => {
  return new Map(files
    .map((file): [string, string] => {
      return [stem(file.source ?? file.target), stem(file.target)];
    })
    .filter(([asset, written]) => {
      return asset !== written;
    }));
};

// One shared asset serves every target: a relative import follows its neighbour to the name this target writes.
const importsRewritten = (file: Starter, renames: Map<string, string>) => {
  const assetDirectory = posix.dirname(file.source ?? file.target);
  const writtenDirectory = posix.dirname(file.target);

  return (source: string): string => {
    return source
      .replaceAll(RELATIVE_SPECIFIER, (whole, quote: string, specifier: string) => {
        const written = renames.get(posix.join(assetDirectory, specifier));

        if (written === undefined) {
          return whole;
        }

        const relative = posix
          .relative(writtenDirectory, written)
          .replace(NOT_DOTTED, './');

        return `${quote}${relative}${quote}`;
      });
  };
};

// Birth only: a project owns its own source from its first run.
export const starterSourceEmitter = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const tests = hasTests(answers) ? target.starterTests : [];

  // A variant and its base exclude each other by their own `when`, held by `registry.test.ts`.
  const files = target.starterFiles
    .filter((file) => {
      return applies(file, answers);
    });
  // After the starter files, since one of them is what a starter test covers.
  const suites = tests
    .filter((test) => {
      return applies(test, answers);
    });
  const renames = renamesOf([...files, ...suites]);

  const artifactOf = (file: Starter): Artifact => {
    const sources = [sourceOf(target.id, file)];

    return {
      stage: 'standard',
      target: file.target,
      content: renames.size === 0
        ? { sources }
        : {
            sources,
            transform: importsRewritten(file, renames),
          },
      seed: true,
    };
  };

  return [
    ...files.map(artifactOf),
    ...suites
      .map((test) => {
        return {
          ...artifactOf(test),
          requires: [test.covers],
        };
      }),
  ];
};
