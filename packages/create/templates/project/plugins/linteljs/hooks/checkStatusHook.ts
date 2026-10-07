// What the check band reads: one word, or nothing outside a git project with a `check` script.
import { checkState } from './utils/checkGateUtils.ts';

const state = checkState(process.cwd());

process.stdout.write(state ?? '');
