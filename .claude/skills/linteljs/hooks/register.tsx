// This repo's own mod. The engine loads one module per plugin and nothing outside the plugin's folder, so the
// shipped check band is carried here byte for byte (held equal by the shipped plugin's `hooks.test.ts`).
import type { Register } from 'claude-code';

import { register as registerCheckBand } from './checkBand.tsx';
import { registerCiBand } from './ciBand.tsx';
import { registerGuards } from './repoGuards.ts';

export const register: Register = (on, options) => {
  registerCheckBand(on, options);
  registerCiBand(on);
  registerGuards(on);
};
