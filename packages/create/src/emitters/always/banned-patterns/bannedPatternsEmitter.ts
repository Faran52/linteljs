import { type Answers, type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

import { mergeChecker } from './utils/mergeUtils';

// Throws: a silent miss on a drifted anchor would ship the strict floor to a relaxed project.
const replaceAnchored = (source: string, anchor: string, replacement: string): string => {
  if (!source.includes(anchor)) {
    throw new Error(`checkBannedPatterns.ts no longer contains the anchor: ${anchor}`);
  }

  return source.replace(anchor, replacement);
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

        return mergeChecker(typedSource, current);
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
