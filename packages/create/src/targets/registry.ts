import { angularTarget } from './angular/angularTarget';
import { astroTarget } from './astro/astroTarget';
import { nextTarget } from './next/nextTarget';
import { nuxtTarget } from './nuxt/nuxtTarget';
import { reactTarget } from './react/reactTarget';
import { reactNativeTarget } from './react-native/reactNativeTarget';
import { solidTarget } from './solid/solidTarget';
import { svelteTarget } from './svelte/svelteTarget';
import { typescriptTarget } from './typescript/typescriptTarget';
import { vueTarget } from './vue/vueTarget';
import { webextensionTarget } from './webextension/webextensionTarget';

import type { Answers, TargetId } from '@config/types';
import type { TargetRecord } from './types';

// Built on each call, so a record's helpers run only for the target asked; a builder may ignore the answers.
export type TargetBuilder = (answers: Answers) => TargetRecord;

export const TARGETS: Record<TargetId, TargetBuilder> = {
  'react': reactTarget,
  'next': nextTarget,
  'vue': vueTarget,
  'nuxt': nuxtTarget,
  'svelte': svelteTarget,
  'solid': solidTarget,
  'angular': angularTarget,
  'astro': astroTarget,
  'webextension': webextensionTarget,
  'react-native': reactNativeTarget,
  'typescript': typescriptTarget,
};

export const targetFor = (answers: Answers): TargetRecord => {
  return TARGETS[answers.target](answers);
};
