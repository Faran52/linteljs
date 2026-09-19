import { type Artifact, copied } from '../../../config/artifact';

export const typecheckStagedEmitter = (): Artifact[] => {
  return [copied('scripts/typecheckStaged.ts', 'scripts/typecheckStaged.ts')];
};
