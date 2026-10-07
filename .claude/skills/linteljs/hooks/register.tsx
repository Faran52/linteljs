// This repo's own mod. The shipped check band is carried byte for byte (held equal by the shipped `hooks.test.ts`);
// only its refresh registers here, since the CI band draws the check state on its own line.
import { registerCheckRefresh } from './checkBand.tsx';
import { registerCiBand } from './ciBand.tsx';
import { registerGuards } from './repoGuards.ts';

import type { Register } from 'claude-code';

export const register: Register = (on) => {
  registerCheckRefresh(on);
  registerCiBand(on);
  registerGuards(on);
};
