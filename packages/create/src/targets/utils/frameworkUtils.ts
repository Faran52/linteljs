import { type HostedFramework, type NamingMap } from '@config/types';

import { keysOf } from '@utils/objectUtils';

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

export const hostedPartsFor = (framework: HostedFramework | undefined): FrameworkParts | undefined => {
  // Keyed by `undefined` too, so a target that hosts no framework looks up nothing rather than branching.
  const hosted = new Map<HostedFramework | undefined, FrameworkParts>(keysOf(PARTS)
    .map((key) => {
      const entry: [HostedFramework | undefined, FrameworkParts] = [key, PARTS[key]];

      return entry;
    }));

  return hosted.get(framework);
};

export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  const naming: NamingMap = {
    [componentGlob]: COMPONENT,
    ...scriptKeys(),
    'src/**/*.d.ts': DECLARATION,
  };

  return naming;
};
