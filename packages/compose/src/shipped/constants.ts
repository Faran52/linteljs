import { ANGULAR_CLI_SUBJECTS } from './subjects/angular-cli/constants';
import { ASTRO_SUBJECTS } from './subjects/astro/constants';
import { EXPO_SUBJECTS } from './subjects/expo/constants';
import { NEXT_SUBJECTS } from './subjects/next/constants';
import { NUXT_SUBJECTS } from './subjects/nuxt/constants';
import { SVELTEKIT_SUBJECTS } from './subjects/sveltekit/constants';
import { VITE_REACT_SUBJECTS } from './subjects/vite-react/constants';
import { VITE_SOLID_SUBJECTS } from './subjects/vite-solid/constants';
import { VITE_VUE_SUBJECTS } from './subjects/vite-vue/constants';
import { WXT_SUBJECTS } from './subjects/wxt/constants';

import type { Subject } from './utils/variantUtils';

// Every composition, by the shipped file each one writes.
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
