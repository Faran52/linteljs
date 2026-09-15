import { fillSlots, sharedSlots } from '../template/template';

import type { Answers } from '../../model/answers/answers';

// Replaced outright: the scaffolder's advice is wrong in a way someone acts on (Solid's port 5173 against the
// emitted 3000). Never touched by `sync`.
export const emitReadme = (template: string, projectName: string, answers: Answers): string => {
  return fillSlots(template, sharedSlots(projectName, answers), 'README.md');
};
