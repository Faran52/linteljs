import type { AnswerRecord } from '../record';

// Never asked: the directories a project grew. Recorded here because `eslint.config.js` is emitted whole, so an
// alias added there was lost on the next `sync`.
export const aliases = {
  key: 'aliases',
  description: 'Aliases this project has beyond the standard set, merged in after it. A value ending in /* names a '
    + 'directory; one ending in a file names a barrel imported bare.',
  kind: 'map',
} as const satisfies AnswerRecord;
