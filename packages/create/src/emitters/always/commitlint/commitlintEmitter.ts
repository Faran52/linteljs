import { type Artifact, copied } from '../../../config/artifact';

export const commitlintEmitter = (): Artifact[] => {
  return [copied('commitlint.config.js', 'commitlint.config.js')];
};
