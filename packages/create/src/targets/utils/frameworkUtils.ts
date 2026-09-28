import { type HostedFramework, type NamingMap } from '@config/types';

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

export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  return {
    [componentGlob]: COMPONENT,
    ...scriptKeys(),
    'src/**/*.d.ts': DECLARATION,
  };
};
