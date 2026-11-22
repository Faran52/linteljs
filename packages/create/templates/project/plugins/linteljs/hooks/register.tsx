// The plugin's one hooks module: a plugin may name only one, so each subject registers here.
import { registerCheckBand } from './checkBand.tsx';
import { registerContextCeiling } from './contextCeiling.tsx';

import type { Register } from 'claude-code';

export const register: Register = (on, options) => {
  registerCheckBand(on);
  registerContextCeiling(on, options);
};
