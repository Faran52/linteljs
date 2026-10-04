import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { copied } from '../../utils/artifactUtils';

import { mergeChecker } from './utils/mergeUtils';

// Throws: a silent miss on a drifted anchor would ship the strict floor to a relaxed project.
const replaceAnchored = (source: string, anchor: string, replacement: string): string => {
  if (!source.includes(anchor)) {
    throw new Error(`checkBannedPatterns.ts no longer contains the anchor: ${anchor}`);
  }

  return source.replace(anchor, replacement);
};

// `.astro` is left out: the checker reads script and SFC files only, so listing it would scan nothing.
const scannedExtensions = (answers: Answers): string[] => {
  const { sfcExtension } = targetFor(answers);

  const extensions = [
    '.ts',
    '.tsx',
    ...(sfcExtension === undefined ? [] : [`.${sfcExtension}`]),
  ];

  return extensions;
};

const withExtensions = (source: string, answers: Answers): string => {
  const quoted = scannedExtensions(answers)
    .map((extension) => {
      return `'${extension}'`;
    });
  // Three or more break, as `@linteljs/array-newline` has them.
  const list = quoted.length <= 2
    ? quoted.join(', ')
    : `\n${quoted
      .map((extension) => {
        return `  ${extension},\n`;
      })
      .join('')}`;

  return replaceAnchored(
    source,
    "const SCANNED_EXTENSIONS: string[] = ['.ts', '.tsx'];",
    `const SCANNED_EXTENSIONS: string[] = [${list}];`,
  );
};

const withTypeSafety = (source: string, answers: Answers): string => {
  return answers.typeSafety === 'relaxed'
    ? replaceAnchored(
        source,
        "const TYPE_SAFETY: TypeSafety = 'strict';",
        "const TYPE_SAFETY: TypeSafety = 'relaxed';",
      )
    : source;
};

export const checkerArtifact = (answers: Answers): Artifact => {
  const artifact: Artifact = {
    stage: 'standard',
    target: 'scripts/checkBannedPatterns.ts',
    content: {
      sources: ['project/scripts/checkBannedPatterns.ts'],
      transform: (source, current) => {
        const typedSource = withTypeSafety(source, answers);
        const scannedSource = withExtensions(typedSource, answers);

        return mergeChecker(scannedSource, current);
      },
    },
  };

  return artifact;
};

export const bannedPatternsEmitter = (answers: Answers): Artifact[] => {
  const artifacts = [
    checkerArtifact(answers),
    copied('scripts/utils/bannedPatternsUtils.ts'),
  ];

  return artifacts;
};
