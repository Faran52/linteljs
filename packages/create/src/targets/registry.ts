import { angularTarget } from './angular/angularTarget';
import { astroTarget } from './astro/astroTarget';
import { nextTarget } from './next/nextTarget';
import { reactTarget } from './react/reactTarget';
import { reactNativeTarget } from './react-native/reactNativeTarget';
import { solidTarget } from './solid/solidTarget';
import { svelteTarget } from './svelte/svelteTarget';
import { vueTarget } from './vue/vueTarget';
import { webextensionTarget } from './webextension/webextensionTarget';

import type { Answers } from '../answers/registry';
import type { TargetId } from '../answers/target/target';
import type { TargetRecord } from './types';

// Built from the answers: an extension composes a browser and a framework, which move most of its fields. The
// seven fixed records ignore the argument, so emitters read one shape.
export type TargetBuilder = (answers: Answers) => TargetRecord;

export const TARGETS: Record<TargetId, TargetBuilder> = {
  'react': () => {
    return reactTarget;
  },
  'next': () => {
    return nextTarget;
  },
  'vue': () => {
    return vueTarget;
  },
  'svelte': svelteTarget,
  'solid': () => {
    return solidTarget;
  },
  'angular': () => {
    return angularTarget;
  },
  'astro': astroTarget,
  'webextension': webextensionTarget,
  'react-native': () => {
    return reactNativeTarget;
  },
};

export const targetFor = (answers: Answers): TargetRecord => {
  return TARGETS[answers.target](answers);
};
