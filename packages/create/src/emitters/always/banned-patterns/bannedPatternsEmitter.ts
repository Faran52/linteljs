import { type Artifact } from '@config/types';

import { type Answers } from '@answers';
import { targetFor } from '@targets';

import { projectSpelling } from '../../utils/shapeUtils';

import { mergeChecker } from './utils/mergeUtils';

// `.tsx` on the React family, where a rendering setup needs JSX (read off `jsx`, since Solid and Vue set `preserve`).
// Newest first: `run/` asks which one a project already holds.
export const SETUP_TESTS_CANDIDATES = ['__mocks__/setupTests.tsx', '__mocks__/setupTests.ts'];

export const setupTestsPath = (answers: Answers, present: readonly string[] = []): string => {
  const own = targetFor(answers).tsconfig.jsx === 'react-jsx'
    ? '__mocks__/setupTests.tsx'
    : '__mocks__/setupTests.ts';

  return projectSpelling(own, present);
};

// Throws: a silent miss on a drifted anchor would ship the strict floor to a relaxed project.
const replaceAnchored = (source: string, anchor: string, replacement: string): string => {
  if (!source.includes(anchor)) {
    throw new Error(`checkBannedPatterns.ts no longer contains the anchor: ${anchor}`);
  }

  return source.replace(anchor, replacement);
};

// `.astro` is left out: the checker reads script and SFC files only, so listing it scanned nothing.
export const scannedExtensions = (answers: Answers): string[] => {
  const { sfcExtension } = targetFor(answers);

  return ['.ts', '.tsx', ...(sfcExtension === undefined ? [] : [`.${sfcExtension}`])];
};

const withExtensions = (source: string, answers: Answers): string => {
  return replaceAnchored(
    source,
    "const SCANNED_EXTENSIONS: string[] = ['.ts', '.tsx'];",
    `const SCANNED_EXTENSIONS: string[] = [${scannedExtensions(answers).map((extension) => {
      return `'${extension}'`;
    }).join(', ')}];`,
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
