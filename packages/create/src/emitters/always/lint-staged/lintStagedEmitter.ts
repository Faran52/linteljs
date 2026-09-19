import { type Artifact } from '../../../config/types';
import { copied } from '../../utils/artifactUtils';

export const lintStagedEmitter = (): Artifact[] => {
  return [copied('lint-staged.config.js', 'always/lint-staged/lint-staged.config.js')];
};
