import { fillSlots, sharedSlots } from './utils/templateUtils';

import type { Answers } from '#answers';
import type { Artifact, ProjectShape } from '#config/types';

// Replaced outright: the scaffolder's advice is wrong in a way someone acts on (Solid's port 5173 against the
// emitted 3000). Never touched by `sync`.
export const emitReadme = (template: string, projectName: string, answers: Answers): string => {
  return fillSlots(template, sharedSlots(projectName, answers), 'README.md');
};

// Every scaffolder's README describes a toolchain the later stages replaced, so this is rewritten on any run
// rather than at birth alone: `--existing` adopts a project whose README says the same wrong thing.
export const readmeEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  return [{
    stage: 'standard',
    target: 'README.md',
    content: {
      sources: ['fragments/readme/template.md'],
      transform: (source: string) => {
        return emitReadme(source, name, answers);
      },
    },
  }];
};
