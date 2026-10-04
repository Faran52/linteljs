import {
  argv,
  env,
  exit,
} from 'node:process';

import { typecheckStaged } from './utils/typecheckStagedUtils.ts';

// Overridable for vue-tsc or svelte-check.
const { TYPECHECK_COMMAND } = env;

const code = typecheckStaged(argv.slice(2), TYPECHECK_COMMAND ?? 'npm run typecheck');

exit(code);
