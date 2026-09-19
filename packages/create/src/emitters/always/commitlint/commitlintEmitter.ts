import { type Artifact } from '../../../config/artifact';
import { copied } from '../../utils/artifactUtils';

export const commitlintEmitter = (): Artifact[] => {
  return [copied('commitlint.config.js', 'commitlint.config.js')];
};
