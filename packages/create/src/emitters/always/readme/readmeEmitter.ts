import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { fillSlots, sharedSlots } from './utils/templateUtils';

// Replaced outright: the scaffolder's advice is wrong in a way someone acts on (port 5173 against 3000).
export const emitReadme = (template: string, projectName: string, answers: Answers): string => {
  return fillSlots(template, sharedSlots(projectName, answers), 'README.md');
};

// Rewritten on any run: `--existing` adopts a project whose README says the same wrong thing.
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
