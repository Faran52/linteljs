import { type HostedFramework, type NamingMap } from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import {
  COMPONENT,
  DECLARATION,
  PARTS,
} from '../constants';

import { scriptKeys } from './namingUtils';

import type { FrameworkParts } from '../types';

export const partsFor = (framework: HostedFramework): FrameworkParts => {
  return PARTS[framework];
};

// Keyed by `undefined` too, so a target that hosts no framework looks up nothing rather than branching.
const HOSTED = new Map<HostedFramework | undefined, FrameworkParts>(valuesOf(PARTS)
  .map((framework) => {
    return [framework, PARTS[framework]];
  }));

export const hostedPartsFor = (framework: HostedFramework | undefined): FrameworkParts | undefined => {
  return HOSTED.get(framework);
};

export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  return {
    [componentGlob]: COMPONENT,
    ...scriptKeys(),
    'src/**/*.d.ts': DECLARATION,
  };
};
