import { type Artifact, type Workspace } from '@config/types';

import { adapterArtifact } from '../utils/adapterUtils';
import { ruleArtifacts } from '../utils/ruleFileUtils';

// From the rule's first heading, so no second wording exists to drift.
const titleOf = (source: string): string => {
  return source
    .split('\n')
    .find((line) => {
      return line.startsWith('# ');
    })
    ?.slice('# '.length) ?? 'LintelJS project standard';
};

export const cursorArtifacts = (workspace: Workspace): Artifact[] => {
  const artifacts: Artifact[] = [
    adapterArtifact(
      '.cursor/rules/linteljs.mdc',
      workspace,
      '---\ndescription: LintelJS project\nalwaysApply: true\n---\n\n',
    ),
    // Cursor spells any-file as `alwaysApply`, so globs and `alwaysApply` move together.
    ...ruleArtifacts(workspace, '.cursor/rules', '.mdc', (source, globs) => {
      const scope = globs === '' ? 'alwaysApply: true' : `globs: ${globs}\nalwaysApply: false`;

      return `---\ndescription: ${titleOf(source)}\n${scope}\n---\n\n`;
    }),
  ];

  return artifacts;
};

export const cursorRulesEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  return answers.agents.includes('cursor') ? cursorArtifacts(workspace) : [];
};
