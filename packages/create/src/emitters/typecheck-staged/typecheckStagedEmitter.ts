import { type Artifact, copied } from '../artifact';

export const typecheckStagedEmitter = (): Artifact[] => {
  return [copied('scripts/typecheckStaged.ts', 'scripts/typecheckStaged.ts')];
};
