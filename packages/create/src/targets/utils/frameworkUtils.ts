import { type HostedFramework, type NamingMap } from '@config/types';

import {
  COMPONENT,
  DECLARATION,
  PARTS,
} from '../constants';

import type { FrameworkParts } from '../types';

export const partsFor = (framework: HostedFramework): FrameworkParts => {
  return PARTS[framework];
};

// The framework's extension marks a component, replacing the host's directory-based rule.
export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  return {
    [componentGlob]: COMPONENT,
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': DECLARATION,
  };
};
