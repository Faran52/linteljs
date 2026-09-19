import { type Artifact } from '../../../config/types';
import { emitted } from '../../utils/artifactUtils';
import { emitAgentAdapter } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

import type { Answers } from '../../../answers';

// Cursor's own `description` key, taken from the rule's first heading so no second wording exists to drift.
const titleOf = (source: string): string => {
  return /^# (.+)$/mu.exec(source)?.[1] ?? 'LintelJS project standard';
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
    // A rule listing no paths governs any file, and Cursor spells that `alwaysApply` rather than with a glob, so the
    // two keys move together: globs and not always, or always and no globs.
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
