import {
  type Answers,
  type Artifact,
  type Workspace,
} from '@config/types';

import { targetFor } from '@targets';

import {
  fillSlots,
  sharedSlots,
  workspaceSlots,
} from './utils/templateUtils';

// Replaced outright: the scaffolder's advice is wrong in a way someone acts on (port 5173 against 3000).
export const emitReadme = (template: string, projectName: string, answers: Answers): string => {
  const slots = sharedSlots(projectName, answers);

  return fillSlots(template, slots, 'README.md');
};

// Rewritten on any run: `--existing` adopts a project whose README says the same wrong thing.
export const readmeEmitter = (workspace: Workspace): Artifact[] => {
  const { projects } = workspace;
  const isNative = projects
    .some(({ answers }) => {
      return targetFor(answers).expoProject === true;
    });
  const native = isNative ? ['fragments/readme/native-build.md'] : [];
  const artifacts: Artifact[] = [{
    stage: 'standard',
    target: 'README.md',
    content: {
      sources: ['fragments/readme/template.md', ...native],
      transform: (source: string) => {
        const [{ name, answers }] = projects;

        if (projects.length === 1) {
          return emitReadme(source, name, answers);
        }

        const slots = workspaceSlots(workspace);

        return fillSlots(source, slots, 'README.md');
      },
    },
  }];

  return artifacts;
};
