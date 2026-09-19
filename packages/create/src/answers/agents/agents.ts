import type { AnswerRecord } from '../record';

export type Agent = keyof typeof agents.values;

export const agents = {
  key: 'agents',
  flag: 'agents',
  prompt: 'AI agents',
  kind: 'multi',
  values: {
    'claude-code': {
      label: 'Claude Code',
      hint: "Anthropic's coding agent",
    },
    'codex': {
      label: 'Codex',
      hint: "OpenAI's coding agent",
    },
    'copilot': {
      label: 'GitHub Copilot',
      hint: 'Reads .github/copilot-instructions.md and .github/instructions/',
    },
    'cursor': {
      label: 'Cursor',
      hint: 'Reads .cursor/rules/',
    },
  },
  default: ['claude-code'],
} as const satisfies AnswerRecord;
