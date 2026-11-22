/**
 * This repo's own mod. The shipped check band and context ceiling are carried byte for byte (held equal by the
 * shipped `hooks.test.ts`); only the band's refresh registers here, since the CI band draws the check state on its
 * own line.
 */
import { registerCheckRefresh } from './checkBand.tsx';
import { registerCiBand } from './ciBand.tsx';
import { registerContextCeiling } from './contextCeiling.tsx';
import { registerGuards } from './repoGuards.ts';

import type { Register } from 'claude-code';

export const register: Register = (on, options) => {
  registerCheckRefresh(on);
  registerCiBand(on);
  registerContextCeiling(on, options);
  registerGuards(on);
};
