import { type Answers, type Artifact } from '@config/types';

import { merged } from '../../utils/artifactUtils';
import { flatOverrides } from '../../utils/packageJsonUtils';

import {
  allowBuildsBlock,
  overridesBlock,
  RELEASE_AGE_BLOCK,
} from './utils/emitUtils';

// create-next-app opts out of exactly the builds linteljs opts into; left in, pnpm refuses the install.
const SUPERSEDED_KEY = 'ignoredBuiltDependencies:';

const withoutSuperseded = (existing: string): string => {
  const kept: string[] = [];
  let dropping = false;

  for (const line of existing.split('\n')) {
    const isTopLevel = line !== '' && !/^[\s-]/.test(line);

    if (isTopLevel) {
      dropping = line.startsWith(SUPERSEDED_KEY);
    }

    if (!dropping) {
      kept.push(line);
    }
  }

  return kept.join('\n');
};

// Line-based: a YAML round-trip would reformat every line the user wrote.
export const mergePnpmWorkspace = (existing: string | null, answers: Answers): string => {
  const remainder = withoutSuperseded(existing ?? '')
    .replace(/^\n+/, '');

  const withBuilds = /^allowBuilds:/m.test(remainder) ? remainder : `${allowBuildsBlock(answers)}${remainder}`;
  const hasAgePolicy = /^minimumReleaseAge:/m.test(withBuilds);
  const withAge = hasAgePolicy ? withBuilds : `${withBuilds.trimEnd()}\n\n${RELEASE_AGE_BLOCK}`;
  const overrides = flatOverrides(answers, 'pnpm');
  const keepsOverrides = Object.keys(overrides).length === 0 || /^overrides:/m.test(withAge);
  const withOverrides = keepsOverrides ? withAge : `${withAge.trimEnd()}\n\n${overridesBlock(overrides)}`;

  // `trimEnd`: an anchored `\n+$` is the shape `sonarjs/super-linear-regex` reports.
  return `${withOverrides.trimEnd()}\n`;
};

// Discarding it breaks an install that already wrote into it.
export const pnpmWorkspaceEmitter = (answers: Answers): Artifact[] => {
  const artifacts: Artifact[] = answers.packageManager === 'pnpm'
    ? [merged('package', 'pnpm-workspace.yaml', (current) => {
        return mergePnpmWorkspace(current, answers);
      })]
    : [];

  return artifacts;
};
