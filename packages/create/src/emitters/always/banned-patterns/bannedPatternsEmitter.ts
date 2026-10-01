import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { mergeChecker } from './utils/mergeUtils';

// Throws: a silent miss on a drifted anchor would ship the strict floor to a relaxed project.
const replaceAnchored = (source: string, anchor: string, replacement: string): string => {
  if (!source.includes(anchor)) {
    throw new Error(`checkBannedPatterns.ts no longer contains the anchor: ${anchor}`);
  }

  return source.replace(anchor, replacement);
};

// `.astro` is left out: the checker reads script and SFC files only, so listing it scanned nothing.
const scannedExtensions = (answers: Answers): string[] => {
  const { sfcExtension } = targetFor(answers);

  return [
    '.ts',
    '.tsx',
    ...(sfcExtension === undefined ? [] : [`.${sfcExtension}`]),
  ];
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
  return {
    stage: 'standard',
    target: 'scripts/checkBannedPatterns.ts',
    content: {
      sources: ['project/scripts/checkBannedPatterns.ts'],
      transform: (source, current) => {
        return mergeChecker(withExtensions(withTypeSafety(source, answers), answers), current);
      },
    },
  };
};

export const bannedPatternsEmitter = (answers: Answers): Artifact[] => {
  return [checkerArtifact(answers)];
};
