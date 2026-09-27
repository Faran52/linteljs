import { angularTarget } from './angular/angularTarget';
import { astroTarget } from './astro/astroTarget';
import { nextTarget } from './next/nextTarget';
import { nuxtTarget } from './nuxt/nuxtTarget';
import { reactTarget } from './react/reactTarget';
import { reactNativeTarget } from './react-native/reactNativeTarget';
import { solidTarget } from './solid/solidTarget';
import { svelteTarget } from './svelte/svelteTarget';
import { vueTarget } from './vue/vueTarget';
import { webextensionTarget } from './webextension/webextensionTarget';

import type { Answers, TargetId } from '@config/types';
import type { TargetRecord } from './types';

// The seven fixed records ignore the argument, so emitters read one shape.
export type TargetBuilder = (answers: Answers) => TargetRecord;

const fixed = (record: TargetRecord): TargetBuilder => {
  return () => {
    return record;
  };
};

export const TARGETS: Record<TargetId, TargetBuilder> = {
  'react': reactTarget,
  'next': fixed(nextTarget),
  'vue': fixed(vueTarget),
  'nuxt': fixed(nuxtTarget),
  'svelte': fixed(svelteTarget),
  'solid': fixed(solidTarget),
  'angular': fixed(angularTarget),
  'astro': astroTarget,
  'webextension': webextensionTarget,
  'react-native': fixed(reactNativeTarget),
};

export const targetFor = (answers: Answers): TargetRecord => {
  return TARGETS[answers.target](answers);
};
