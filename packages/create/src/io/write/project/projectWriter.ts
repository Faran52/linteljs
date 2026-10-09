import { artifactWriter } from '@disk';

import type { Artifact } from '@config/types';

// A create run writes everything once, seeds included.
export const projectWriter = async (cwd: string, artifacts: readonly Omit<Artifact, 'stage'>[]): Promise<void> => {
  await Promise.all(artifacts
    .map(async (artifact) => {
      return await artifactWriter(cwd, artifact, true);
    }));
};
