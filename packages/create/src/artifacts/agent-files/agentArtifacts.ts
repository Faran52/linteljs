import {
  type Artifact,
  copied,
  emitted,
  merged,
} from '../artifact/artifact';
import { referenceArtifacts } from '../lintel-plugin/referenceArtifacts';

import { emitAgentAdapter } from './emitAgentAdapter';
import { copilotArtifacts, cursorArtifacts } from './emitAgentRules';
import { emitClaudeSettings } from './emitClaudeSettings';
import { emitCodexMarketplace } from './emitCodexMarketplace';
import { mergeClaudeSettings } from './mergeClaudeSettings';

import type { Answers } from '../../model/answers/answers';

// Every rule file a project can receive, named once. Claude and Codex read them as the plugin's skill references;
// Copilot and Cursor have no plugin system, so each gets its own copy under the directory it actually reads.
const RULE_NAMES = [
  'type-standards.md',
  'repo-structure.md',
  'react-state.md',
  'hooks-order.md',
  'vue-reactivity.md',
  'svelte-reactivity.md',
  'solid-reactivity.md',
  'type-standards-zod.md',
  'testing.md',
];

const stem = (name: string): string => {
  return name.replace(/\.md$/u, '');
};

// What `sync` may remove. The adapters are absent on purpose: they are `preserve: true`, so they are the project's.
export const GENERATED_AGENT_TARGETS: readonly string[] = [
  '.claude/settings.json',
  '.agents/plugins/marketplace.json',
  'plugins/linteljs/.claude-plugin/plugin.json',
  'plugins/linteljs/.claude-plugin/marketplace.json',
  'plugins/linteljs/.codex-plugin/plugin.json',
  'plugins/linteljs/skills/linteljs/SKILL.md',
  ...RULE_NAMES.map((name) => {
    return `plugins/linteljs/skills/linteljs/references/${name}`;
  }),
  'plugins/linteljs/hooks/hooks.json',
  'plugins/linteljs/hooks/commandParser.js',
  'plugins/linteljs/hooks/eslint-fix-warning.sh',
  'plugins/linteljs/hooks/git-safety-guard.sh',
  'plugins/linteljs/hooks/banned-pattern-guard.sh',
  ...RULE_NAMES.map((name) => {
    return `.github/instructions/${stem(name)}.instructions.md`;
  }),
  ...RULE_NAMES.map((name) => {
    return `.cursor/rules/${stem(name)}.mdc`;
  }),
];

const adapter = (target: 'CLAUDE.md' | 'AGENTS.md', answers: Answers): Artifact => {
  return {
    ...emitted('standard', target, emitAgentAdapter(answers)),
    preserve: true,
  };
};

export const agentArtifacts = (answers: Answers): Artifact[] => {
  const artifacts: Artifact[] = [
    copied(
      'plugins/linteljs/skills/linteljs/SKILL.md',
      'linteljs-plugin/skills/linteljs/SKILL.md',
    ),
    ...referenceArtifacts(answers),
    copied('plugins/linteljs/hooks/hooks.json', 'linteljs-plugin/hooks/hooks.json'),
    copied(
      'plugins/linteljs/hooks/commandParser.js',
      'linteljs-plugin/hooks/commandParser.js',
    ),
    {
      ...copied(
        'plugins/linteljs/hooks/eslint-fix-warning.sh',
        'linteljs-plugin/hooks/eslint-fix-warning.sh',
      ),
      executable: true,
    },
    {
      ...copied(
        'plugins/linteljs/hooks/git-safety-guard.sh',
        'linteljs-plugin/hooks/git-safety-guard.sh',
      ),
      executable: true,
    },
    {
      ...copied(
        'plugins/linteljs/hooks/banned-pattern-guard.sh',
        'linteljs-plugin/hooks/banned-pattern-guard.sh',
      ),
      executable: true,
    },
  ];

  if (answers.agents.includes('claude-code')) {
    artifacts.push(
      adapter('CLAUDE.md', answers),
      merged('standard', '.claude/settings.json', (current) => {
        return mergeClaudeSettings(emitClaudeSettings(answers.plugins), current);
      }),
      copied(
        'plugins/linteljs/.claude-plugin/plugin.json',
        'linteljs-plugin/.claude-plugin/plugin.json',
      ),
      copied(
        'plugins/linteljs/.claude-plugin/marketplace.json',
        'linteljs-plugin/.claude-plugin/marketplace.json',
      ),
    );
  }

  if (answers.agents.includes('codex')) {
    artifacts.push(
      adapter('AGENTS.md', answers),
      emitted(
        'standard',
        '.agents/plugins/marketplace.json',
        emitCodexMarketplace(answers.plugins),
      ),
      copied(
        'plugins/linteljs/.codex-plugin/plugin.json',
        'linteljs-plugin/.codex-plugin/plugin.json',
      ),
    );
  }

  if (answers.agents.includes('copilot')) {
    artifacts.push(...copilotArtifacts(answers));
  }

  if (answers.agents.includes('cursor')) {
    artifacts.push(...cursorArtifacts(answers));
  }

  return artifacts;
};
