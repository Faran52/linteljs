import {
  type Answers,
  type Artifact,
  type Plugin,
} from '@config/types';

import { copied, merged } from '../../utils/artifactUtils';
import { adapterArtifact } from '../utils/adapterUtils';

import { mergeClaudeSettings, type StatusLine } from './utils/mergeUtils';

// A plugin cannot set `statusLine`, so both badges are wired here, from the plugin the project carries.
const statusLineOf = (script: string): StatusLine => {
  return {
    type: 'command',
    command: `node "\${CLAUDE_PROJECT_DIR}/plugins/linteljs/hooks/${script}"`,
  };
};

export const emitClaudeSettings = (plugins: Plugin[]): string => {
  const usesOfficialMarketplace = plugins.includes('context7')
    || plugins.includes('frontend-design');
  const settings = {
    // Every current agent appends `Co-Authored-By` by default, and the generated rules ban rewriting a commit.
    includeCoAuthoredBy: false,
    statusLine: {
      ...statusLineOf('mainStatusLine.ts'),
      refreshInterval: 5,
    },
    subagentStatusLine: statusLineOf('subagentStatusLine.ts'),
    enabledPlugins: {
      'linteljs@linteljs': true,
      ...(plugins.includes('ponytail') ? { 'ponytail@ponytail': true } : {}),
      ...(plugins.includes('context7')
        ? { 'context7@claude-plugins-official': true }
        : {}),
      ...(plugins.includes('frontend-design')
        ? { 'frontend-design@claude-plugins-official': true }
        : {}),
    },
    extraKnownMarketplaces: {
      linteljs: {
        source: {
          source: 'directory',
          path: './plugins/linteljs',
        },
      },
      ...(plugins.includes('ponytail')
        ? {
            ponytail: {
              source: {
                source: 'github',
                repo: 'DietrichGebert/ponytail',
              },
            },
          }
        : {}),
      ...(usesOfficialMarketplace
        ? {
            'claude-plugins-official': {
              source: {
                source: 'github',
                repo: 'anthropics/claude-plugins-official',
              },
            },
          }
        : {}),
    },
  };

  return `${JSON.stringify(settings, null, 2)}\n`;
};

export const claudeSettingsEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('claude-code')) {
    return [];
  }

  return [
    adapterArtifact('CLAUDE.md', answers),
    {
      ...merged('standard', '.claude/settings.json', (current) => {
        return mergeClaudeSettings(emitClaudeSettings(answers.plugins), current);
      }),
      removable: true,
    },
    copied('plugins/linteljs/.claude-plugin/plugin.json'),
    copied('plugins/linteljs/.claude-plugin/marketplace.json'),
  ];
};
