import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

// pnpm's two days, in seconds. Bun 1.2 ignores the keys, 1.3.0 honours them; exclusions are matched by exact name.
const BUNFIG = `[install]
minimumReleaseAge = 172800
minimumReleaseAgeExcludes = ["@linteljs/eslint-config", "@linteljs/eslint-plugin"]
`;

export const bunfigEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'bun' ? [emitted('package', 'bunfig.toml', BUNFIG)] : [];
};
