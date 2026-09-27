import { type Answers, type Artifact } from '@config/types';

import { merged } from '../../utils/artifactUtils';

import { allowBuildsBlock, RELEASE_AGE_BLOCK } from './utils/emitUtils';

// create-next-app opts out of exactly the builds linteljs opts into; left in, pnpm refuses the install.
const SUPERSEDED_KEY = 'ignoredBuiltDependencies:';

// Line-based: a YAML round-trip would reformat every line the user wrote.
export const mergePnpmWorkspace = (existing: string | null, answers: Answers): string => {
  const lines = (existing ?? '').split('\n');
  const kept: string[] = [];
  let dropping = false;

  for (const line of lines) {
    const isTopLevel = line !== '' && !/^[\s-]/.test(line);

    if (isTopLevel) {
      dropping = line.startsWith(SUPERSEDED_KEY);
    }

    if (!dropping) {
      kept.push(line);
    }
  }

  const remainder = kept
    .join('\n')
    .replace(/^\n+/, '');

  // A present block is the project's.
  const withBuilds = /^allowBuilds:/m.test(remainder) ? remainder : `${allowBuildsBlock(answers)}${remainder}`;
  const hasAgePolicy = /^minimumReleaseAge:/m.test(withBuilds);
  const withAge = hasAgePolicy ? withBuilds : `${withBuilds.trimEnd()}\n\n${RELEASE_AGE_BLOCK}`;

  // `trimEnd`: an anchored `\n+$` is the shape `sonarjs/super-linear-regex` reports.
  return `${withAge.trimEnd()}\n`;
};

// Only where it means something; discarding it breaks an install that already wrote into it.
export const pnpmWorkspaceEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'pnpm'
    ? [merged('package', 'pnpm-workspace.yaml', (current) => {
        return mergePnpmWorkspace(current, answers);
      })]
    : [];
};
