// Stage 4, `standard`, also writes the hooks, the checker, the test setup and the build configs.

export type Stage
  = 'scaffold'
    | 'lint'
    | 'package'
    | 'standard'
    | 'install'
    | 'fix';

export const STAGES: Stage[] = [
  'scaffold',
  'lint',
  'package',
  'standard',
  'install',
  'fix',
];
