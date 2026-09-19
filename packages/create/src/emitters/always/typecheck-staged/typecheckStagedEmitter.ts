import { type Artifact } from '../../../config/artifact';
import { copied } from '../../utils/artifactUtils';

export const typecheckStagedEmitter = (): Artifact[] => {
  return [copied('scripts/typecheckStaged.ts', 'scripts/typecheckStaged.ts')];
};
