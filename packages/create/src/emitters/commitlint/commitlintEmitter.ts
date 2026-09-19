import { type Artifact, copied } from '../artifact';

export const commitlintEmitter = (): Artifact[] => {
  return [copied('commitlint.config.js', 'commitlint.config.js')];
};
