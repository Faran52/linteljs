import { type Artifact } from '../../../config/types';
import { copied } from '../../utils/artifactUtils';

export const typecheckStagedEmitter = (): Artifact[] => {
  return [copied('scripts/typecheckStaged.ts')];
};
