import type { Library } from '@config/types';
import type { MultiRecord } from '../../types';

// Only what a dependency alone can be. Anything that changes what is emitted is its own field: a single select
// hiding inside a multi select leaves the full library set an illegal value of itself.
export const librariesAnswer = {
  key: 'libraries',
  flag: 'libraries',
  prompt: 'Libraries',
  kind: 'multi',
  values: {
    'zod': {
      label: 'Zod',
      hint: 'Schema validation and parsing',
    },
    'es-toolkit': {
      label: 'es-toolkit',
      hint: 'Typed utility functions, the modern lodash',
    },
    'ts-pattern': {
      label: 'ts-pattern',
      hint: 'Exhaustive pattern matching',
    },
    't3-env': {
      label: 't3-env',
      hint: 'Zod-validated environment variables',
    },
  },
  default: ['es-toolkit'],
} as const satisfies MultiRecord<Library>;
