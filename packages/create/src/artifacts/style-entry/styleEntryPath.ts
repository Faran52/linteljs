import { targetFor } from '../../model/targets';
import { projectSpelling } from '../project-shape/projectShape';

import type { Answers } from '../../model/answers/answers';

// Discovered rather than asked: writing the target's default beside a project's own left a second entry nothing
// imported.
export const STYLE_ENTRY_CANDIDATES = [
  'src/styles/tailwind.css',
  'src/styles/global.css',
  'src/styles/globals.css',
  'src/styles/index.css',
  'src/app/globals.css',
  'src/assets/main.css',
  'src/global.css',
  'src/globals.css',
  'src/styles.css',
  'src/index.css',
  'src/app.css',
  'src/style.css',
];

// The target's own where present, the project's otherwise, and the target's default at birth.
export const styleEntryPath = (answers: Answers, present: readonly string[]): string | undefined => {
  return projectSpelling(targetFor(answers).styleEntry, present);
};
