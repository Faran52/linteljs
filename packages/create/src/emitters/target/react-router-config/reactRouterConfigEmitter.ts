import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

/**
 * React Router's own config, which framework mode reads and no other answer writes.
 *
 * `appDirectory` is the whole reason this is emitted rather than left at its default. React Router looks for
 * `app/`, this repository puts source in `src/`, and one line here is what keeps every glob it writes reading a
 * single root. `ssr` is on, which is what makes this framework mode rather than the same router in a SPA.
 */
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
