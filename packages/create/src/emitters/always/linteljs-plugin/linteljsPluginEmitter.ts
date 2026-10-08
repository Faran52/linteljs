import { type Artifact, type Workspace } from '@config/types';

import { ruleArtifacts } from '../../agents/utils/ruleFileUtils';
import { copied } from '../../utils/artifactUtils';

export const referenceArtifacts = (workspace: Workspace): Artifact[] => {
  return ruleArtifacts(workspace, 'plugins/linteljs/skills/linteljs/references', '.md', () => {
    return '';
  });
};

export const linteljsPluginEmitter = (workspace: Workspace): Artifact[] => {
  const artifacts = [
    copied('plugins/linteljs/skills/linteljs/SKILL.md'),
    ...referenceArtifacts(workspace),
    copied('plugins/linteljs/hooks/gitSafetyGuardHook.ts'),
    copied('plugins/linteljs/hooks/eslintFixWarningHook.ts'),
    copied('plugins/linteljs/hooks/bannedPatternGuardHook.ts'),
    copied('plugins/linteljs/hooks/commitGateHook.ts'),
    copied('plugins/linteljs/hooks/checkRecordHook.ts'),
    copied('plugins/linteljs/hooks/checkStatusHook.ts'),
    copied('plugins/linteljs/hooks/generatedFileGuardHook.ts'),
    copied('plugins/linteljs/hooks/contextWarningHook.ts'),
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
