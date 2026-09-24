import {
  COMPONENT,
  DECLARATION,
  PARTS,
} from '../constants';

import type { HostedFramework } from '#answers/target/hosted-framework/hostedFrameworkAnswer';
import type { NamingMap } from '#config/types';
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
