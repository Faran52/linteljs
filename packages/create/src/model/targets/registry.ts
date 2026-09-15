import { angular } from './angular';
import { astro } from './astro';
import { next } from './next';
import { react } from './react';
import { reactNative } from './reactNative';
import { solid } from './solid';
import { svelte } from './svelte';
import { vue } from './vue';
import { webextension } from './webextension';

import type { Answers, TargetId } from '../answers/answers';
import type { TargetRecord } from './record';

// Built from the answers: an extension composes a browser and a framework, which move most of its fields. The
// seven fixed records ignore the argument, so emitters read one shape.
export type TargetBuilder = (answers: Answers) => TargetRecord;

export const TARGETS: Record<TargetId, TargetBuilder> = {
  'react': () => {
    return react;
  },
  'next': () => {
    return next;
  },
  'vue': () => {
    return vue;
  },
  'svelte': svelte,
  'solid': () => {
    return solid;
  },
  'angular': () => {
    return angular;
  },
  'astro': astro,
  'webextension': webextension,
  'react-native': () => {
    return reactNative;
  },
};

export const targetFor = (answers: Answers): TargetRecord => {
  return TARGETS[answers.target](answers);
};
