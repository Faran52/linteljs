import type { AnswerRecord } from '../../types';

// Recorded because `eslint.config.js` is emitted whole, so an alias added there was lost on `sync`.
export const aliasesAnswer = {
  key: 'aliases',
  description: 'Aliases this project has beyond the standard set, merged in after it. A value ending in /* names a '
    + 'directory; one ending in a file names a barrel imported bare.',
  kind: 'map',
} as const satisfies AnswerRecord;
