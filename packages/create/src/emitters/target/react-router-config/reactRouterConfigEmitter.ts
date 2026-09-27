import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// `appDirectory`: React Router looks for `app/`, and source lives in `src/`.
export const emitReactRouterConfig = (): string => {
  return [
    "import type { Config } from '@react-router/dev/config';",
    '',
    'export default {',
    '  // `src`, not the default `app`: one source root, the same as every other target this CLI writes.',
    "  appDirectory: 'src',",
    '  ssr: true,',
    '} satisfies Config;',
    '',
  ].join('\n');
};

export const reactRouterConfigEmitter: Emitter = (answers): Artifact[] => {
  const { reactRouterProject } = targetFor(answers);

  return reactRouterProject === true
    ? [emitted('package', 'react-router.config.ts', emitReactRouterConfig())]
    : [];
};
