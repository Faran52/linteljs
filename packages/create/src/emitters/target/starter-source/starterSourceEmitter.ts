import { posix } from 'node:path';

import {
  type AliasMap,
  type Answers,
  type Artifact,
  type TargetId,
} from '@config/types';

import { hasTests } from '@utils/answerUtils';

import {
  starterApplies,
  type StarterFile,
  type StarterTest,
  targetFor,
} from '@targets';

import { buildAliases } from '../../utils/aliasUtils';
import { testRunnerOf } from '../../utils/runnerUtils';

import {
  RELATIVE_SPECIFIER,
  STYLEX_ATTRS,
  STYLEX_PROPS,
  USE_CLIENT,
} from './constants';
import { inJestDialect } from './utils/jestDialectUtils';
import { importSpecifier, stem } from './utils/starterPathUtils';
import { withWorkerStart } from './utils/workerStartUtils';

type Starter = StarterFile | StarterTest;

const rootOf = (id: TargetId, shared: true | TargetId | undefined): string => {
  if (shared === undefined) {
    return id;
  }

  return shared === true ? 'shared' : shared;
};

const sourceOf = (id: TargetId, file: Starter): string => {
  const asset = file.source ?? file.target;

  const sourcePath = [
    'starter-source',
    rootOf(id, file.shared),
    file.variant,
    asset,
  ]
    .filter(Boolean)
    .join('/');

  return sourcePath;
};

// Asset stem to written stem, for each file this project writes under another name than its asset's.
const renamesOf = (files: Starter[]): Map<string, string> => {
  const renamedStems = files
    .map((file): [string, string] => {
      const stems: [string, string] = [stem(file.source ?? file.target), stem(file.target)];

      return stems;
    })
    .filter(([asset, written]) => {
      return asset !== written;
    });

  return new Map(renamedStems);
};

// One shared asset serves every target: a relative import follows its neighbour to the name and place this target
// writes, through an alias where it crosses into an aliased directory.
const importsRewritten = (file: Starter, renames: Map<string, string>, aliases: AliasMap) => {
  const assetDirectory = posix.dirname(file.source ?? file.target);
  const writtenDirectory = posix.dirname(file.target);

  return (source: string): string => {
    return source
      .replaceAll(RELATIVE_SPECIFIER, (whole, quote: string, specifier: string) => {
        const written = renames.get(posix.join(assetDirectory, specifier));

        if (written === undefined) {
          return whole;
        }

        const rewritten = importSpecifier(writtenDirectory, written, aliases);

        return `${quote}${rewritten}${quote}`;
      });
  };
};

const spreadAsAttrs = (source: string): string => {
  return source.replaceAll(STYLEX_PROPS, STYLEX_ATTRS);
};

const openAsClient = (source: string): string => {
  return `${USE_CLIENT}${source}`;
};

// Birth only: a project owns its own source from its first run.
export const starterSourceEmitter = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const tests = hasTests(answers) ? target.starterTests : [];

  // A variant and its base exclude each other by their own `when`, held by `registry.test.ts`.
  const files = target.starterFiles
    .filter((file) => {
      return starterApplies(file, answers);
    });
  // After the starter files, since one of them is what a starter test covers.
  const suites = tests
    .filter((test) => {
      return starterApplies(test, answers);
    });
  const renames = renamesOf([...files, ...suites]);
  const aliases = buildAliases(answers);
  const clientBoundaries = new Set(target.clientBoundaries);
  const isJest = testRunnerOf(answers) === 'jest';
  const workerStart = answers.mocking === 'msw' ? target.workerStart : undefined;

  const artifactOf = (file: Starter): Artifact => {
    // Bytes, not text: no rewrite applies, and a UTF-8 round trip would corrupt it.
    if (file.target.endsWith('.png')) {
      const image: Artifact = {
        stage: 'standard',
        target: file.target,
        content: { bytes: sourceOf(target.id, file) },
        seed: true,
      };

      return image;
    }

    const sources = [sourceOf(target.id, file)];
    const rewritten = importsRewritten(file, renames, aliases);
    const transform = 'transform' in file ? file.transform : undefined;
    const steps = [
      ...renames.size === 0 ? [] : [rewritten],
      ...'stylexAttrs' in file ? [spreadAsAttrs] : [],
      ...clientBoundaries.has(file.target) ? [openAsClient] : [],
      ...workerStart?.entries.includes(file.target) ? [withWorkerStart(workerStart)] : [],
      ...isJest && 'covers' in file ? [inJestDialect] : [],
      ...transform === undefined
        ? []
        : [(source: string) => {
            return transform(source, answers);
          }],
    ];

    const artifact: Artifact = {
      stage: 'standard',
      target: file.target,
      content: steps.length === 0
        ? { sources }
        : {
            sources,
            transform: (source) => {
              return steps
                .reduce((text, step) => {
                  return step(text);
                }, source);
            },
          },
      seed: true,
    };

    return artifact;
  };

  const artifacts = [
    ...files.map(artifactOf),
    ...suites
      .map((test) => {
        const suite: Artifact = {
          ...artifactOf(test),
          requires: [test.covers],
        };

        return suite;
      }),
  ];

  return artifacts;
};
