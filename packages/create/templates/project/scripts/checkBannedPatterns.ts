// `create --existing` rewrites this file but carries over your `PROJECT_BANNED` and `PROJECT_SKIPPED` lists.
import { argv, exit } from 'node:process';

import {
  type BannedPattern,
  BASE_SKIPPED,
  checkBanned,
  FLOORS,
  type TypeSafety,
} from './utils/bannedPatternsUtils.ts';

// Which floor this project runs. `@linteljs/create` writes this line from the `typeSafety` answer.
const TYPE_SAFETY: TypeSafety = 'strict';

// What a directory argument is searched for. `@linteljs/create` writes this line from the target.
const SCANNED_EXTENSIONS: string[] = ['.ts', '.tsx'];

const PROJECT_BANNED: BannedPattern[] = [];

const PROJECT_SKIPPED: string[] = [];

const code = checkBanned(argv.slice(2), {
  patterns: [...FLOORS[TYPE_SAFETY], ...PROJECT_BANNED],
  skipped: [...BASE_SKIPPED, ...PROJECT_SKIPPED],
  extensions: SCANNED_EXTENSIONS,
});

exit(code);
