import { type Artifact, type Workspace } from '@config/types';

import { ruleArtifacts } from '../../agents/utils/ruleFileUtils';
import { copied } from '../../utils/artifactUtils';

export const referenceArtifacts = (workspace: Workspace): Artifact[] => {
  return ruleArtifacts(workspace, 'plugins/linteljs/skills/linteljs/references', '.md', () => {
    return '';
  });
};

const SKILL = 'plugins/linteljs/skills/linteljs/SKILL.md';

// Added rather than in the template, so a single layout's copy stays as it was.
const MONOREPO_LINE = 'In this monorepo each reference is named for its framework: the nearest '
  + '`CLAUDE.md` or `AGENTS.md`\n'
  + 'under `apps/` or `packages/` names the ones for that project.\n';

const skillArtifact = (workspace: Workspace): Artifact => {
  const skill = copied(SKILL);

  if (workspace.projects[0].answers.layout !== 'monorepo') {
    return skill;
  }

  const monorepo: Artifact = {
    ...skill,
    content: {
      sources: [`project/${SKILL}`],
      transform: (source: string) => {
        return `${source}\n${MONOREPO_LINE}`;
      },
    },
  };

  return monorepo;
};

export const linteljsPluginEmitter = (workspace: Workspace): Artifact[] => {
  const artifacts = [
    skillArtifact(workspace),
    ...referenceArtifacts(workspace),
    copied('plugins/linteljs/hooks/gitSafetyGuardHook.ts'),
    copied('plugins/linteljs/hooks/eslintFixWarningHook.ts'),
    copied('plugins/linteljs/hooks/bannedPatternGuardHook.ts'),
    copied('plugins/linteljs/hooks/commitGateHook.ts'),
    copied('plugins/linteljs/hooks/checkRecordHook.ts'),
    copied('plugins/linteljs/hooks/checkStatusHook.ts'),
    copied('plugins/linteljs/hooks/generatedFileGuardHook.ts'),
    copied('plugins/linteljs/hooks/mainStatusLineHook.ts'),
    copied('plugins/linteljs/hooks/subagentStatusLineHook.ts'),
    copied('plugins/linteljs/hooks/constants.ts'),
    copied('plugins/linteljs/hooks/utils/bannedPatternUtils.ts'),
    copied('plugins/linteljs/hooks/utils/checkGateUtils.ts'),
    copied('plugins/linteljs/hooks/utils/commandParserUtils.ts'),
    copied('plugins/linteljs/hooks/utils/contextUtils.ts'),
    copied('plugins/linteljs/hooks/utils/eslintFixUtils.ts'),
    copied('plugins/linteljs/hooks/utils/generatedFileUtils.ts'),
    copied('plugins/linteljs/hooks/utils/gitSafetyUtils.ts'),
    copied('plugins/linteljs/hooks/utils/hostUtils.ts'),
  ];

  return artifacts;
};
