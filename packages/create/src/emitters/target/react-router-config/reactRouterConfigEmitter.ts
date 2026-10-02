import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// `appDirectory`: React Router looks for `app/`, and source lives in `src/`.
export const emitReactRouterConfig = (): string => {
  const config = [
    "import type { Config } from '@react-router/dev/config';",
    '',
    'export default {',
    "  appDirectory: 'src',",
    '  ssr: true,',
    '} satisfies Config;',
    '',
  ].join('\n');

  return config;
};

export const reactRouterConfigEmitter: Emitter = (answers): Artifact[] => {
  const { reactRouterProject } = targetFor(answers);

  if (reactRouterProject !== true) {
    return [];
  }

  const config = emitReactRouterConfig();
  const artifacts = [emitted('package', 'react-router.config.ts', config)];

  return artifacts;
};
