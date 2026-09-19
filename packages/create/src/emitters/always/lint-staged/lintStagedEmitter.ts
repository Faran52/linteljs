import { type Artifact } from '../../../config/artifact';
import { copied } from '../../utils/artifactUtils';

export const lintStagedEmitter = (): Artifact[] => {
  return [copied('lint-staged.config.js', 'lint-staged.config.js')];
};
