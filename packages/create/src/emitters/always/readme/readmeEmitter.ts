import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { targetFor } from '@targets';

import { fillSlots, sharedSlots } from './utils/templateUtils';

// Replaced outright: the scaffolder's advice is wrong in a way someone acts on (port 5173 against 3000).
export const emitReadme = (template: string, projectName: string, answers: Answers): string => {
  const slots = sharedSlots(projectName, answers);

  return fillSlots(template, slots, 'README.md');
};

// Rewritten on any run: `--existing` adopts a project whose README says the same wrong thing.
export const readmeEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  const { expoProject } = targetFor(answers);
  const native = expoProject === true ? ['fragments/readme/native-build.md'] : [];
  const artifacts: Artifact[] = [{
    stage: 'standard',
    target: 'README.md',
    content: {
      sources: ['fragments/readme/template.md', ...native],
      transform: (source: string) => {
        return emitReadme(source, name, answers);
      },
    },
  }];

  return artifacts;
};
