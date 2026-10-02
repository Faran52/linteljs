import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

interface CopilotHook {
  type: 'command';
  matcher: string;
  command: string;
  cwd: '.';
}

// `command`: the line is the same in both shells. `cwd` is relative to the repository root.
const hook = (name: string, matcher: string): CopilotHook => {
  const entry: CopilotHook = {
    type: 'command',
    matcher,
    command: `node plugins/linteljs/hooks/${name}Hook.ts`,
    cwd: '.',
  };

  return entry;
};

const COPILOT_HOOKS = {
  version: 1,
  hooks: {
    preToolUse: [hook('gitSafetyGuard', 'bash|powershell')],
    postToolUse: [
      hook('eslintFixWarning', 'bash|powershell'),
      hook('bannedPatternGuard', 'edit|create|str_replace_editor|apply_patch'),
    ],
  },
};

export const copilotHooksEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('copilot')) {
    return [];
  }

  const hooks = `${JSON.stringify(COPILOT_HOOKS, null, 2)}\n`;
  const artifacts = [emitted('standard', '.github/hooks/linteljs.json', hooks)];

  return artifacts;
};
