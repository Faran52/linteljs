import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';
import { emitAgentAdapter } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

// From the rule's first heading, so no second wording exists to drift.
const titleOf = (source: string): string => {
  return /^# (.+)/mu.exec(source)?.[1] ?? 'LintelJS project standard';
};

export const cursorArtifacts = (answers: Answers): Artifact[] => {
  return [
    {
      ...emitted(
        'standard',
        '.cursor/rules/linteljs.mdc',
        `---\ndescription: LintelJS project\nalwaysApply: true\n---\n\n${emitAgentAdapter(answers)}`,
      ),
      preserve: true,
    },
    // Cursor spells any-file as `alwaysApply`, so globs and `alwaysApply` move together.
    ...ruleArtifacts(answers, '.cursor/rules', '.mdc', (source) => {
      const globs = globsOf(source);
      const scope = globs === '' ? 'alwaysApply: true' : `globs: ${globs}\nalwaysApply: false`;

      return `---\ndescription: ${titleOf(source)}\n${scope}\n---\n\n`;
    }),
  ];
};

export const cursorRulesEmitter = (answers: Answers): Artifact[] => {
  return answers.agents.includes('cursor') ? cursorArtifacts(answers) : [];
};
