import { type Artifact, copied } from '../../artifact';

export const lintStagedEmitter = (): Artifact[] => {
  return [copied('lint-staged.config.js', 'lint-staged.config.js')];
};
