import { ANGULAR_CLI_SUBJECTS } from './subjects/angular-cli/constants.ts';
import { ASTRO_SUBJECTS } from './subjects/astro/constants.ts';
import { EXPO_SUBJECTS } from './subjects/expo/constants.ts';
import { NEXT_SUBJECTS } from './subjects/next/constants.ts';
import { NUXT_SUBJECTS } from './subjects/nuxt/constants.ts';
import { SVELTEKIT_SUBJECTS } from './subjects/sveltekit/constants.ts';
import { VITE_REACT_SUBJECTS } from './subjects/vite-react/constants.ts';
import { VITE_SOLID_SUBJECTS } from './subjects/vite-solid/constants.ts';
import { VITE_VUE_SUBJECTS } from './subjects/vite-vue/constants.ts';
import { WXT_SUBJECTS } from './subjects/wxt/constants.ts';

import type { Subject } from './utils/composeUtils.ts';

const TEMPLATES_DIR = 'packages/create/templates';

export const SOURCES_DIR = `${TEMPLATES_DIR}/codegen/compose-sources`;

export const SHELLS_DIR = `${TEMPLATES_DIR}/shells`;

// Every composition the engine's suites hold, by the shipped file each one writes.
export const SUBJECTS: readonly Subject[] = [
  ...VITE_REACT_SUBJECTS,
  ...ASTRO_SUBJECTS,
  ...NUXT_SUBJECTS,
  ...SVELTEKIT_SUBJECTS,
  ...VITE_SOLID_SUBJECTS,
  ...VITE_VUE_SUBJECTS,
  ...ANGULAR_CLI_SUBJECTS,
  ...NEXT_SUBJECTS,
  ...EXPO_SUBJECTS,
  ...WXT_SUBJECTS,
];
