import { join } from 'node:path';

// A templates root in miniature: `frameworks/<framework>/<dir>/<drawer>/` and `common/{languages,agents}/`.
export const DRAWERS_ROOT = join(import.meta.dirname, 'drawers');
