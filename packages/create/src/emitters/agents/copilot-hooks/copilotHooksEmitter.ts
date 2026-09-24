import { type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

import type { Answers } from '@answers';

interface CopilotHook {
  type: 'command';
  matcher: string;
  command: string;
  cwd: '.';
}

/**
 * `command` rather than `bash` and `powershell`: the line is the same in both shells, and Copilot copies it into
 * whichever it runs. `cwd` is relative to the repository root, so the path holds wherever the CLI was started. The
 * eslint warning is added context, which Copilot takes only after a tool has run.
 */
const hook = (name: string, matcher: string): CopilotHook => {
  return {
    type: 'command',
    matcher,
    command: `node plugins/linteljs/hooks/${name}Hook.ts`,
    cwd: '.',
  };
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

  return [emitted('standard', '.github/hooks/linteljs.json', `${JSON.stringify(COPILOT_HOOKS, null, 2)}\n`)];
};
