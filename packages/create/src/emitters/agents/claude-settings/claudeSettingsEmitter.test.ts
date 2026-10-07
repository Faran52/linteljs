import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { claudeSettingsEmitter, emitClaudeSettings } from './claudeSettingsEmitter';

import type { Answers } from '@config/types';

const STATUS_LINES = {
  statusLine: {
    type: 'command',
    command: 'node "${CLAUDE_PROJECT_DIR}/plugins/linteljs/hooks/mainStatusLineHook.ts"',
    refreshInterval: 5,
  },
  subagentStatusLine: {
    type: 'command',
    command: 'node "${CLAUDE_PROJECT_DIR}/plugins/linteljs/hooks/subagentStatusLineHook.ts"',
  },
};

describe('emitClaudeSettings', () => {
  it('enables every selected plugin with its required marketplace', () => {
    const settings: unknown = JSON.parse(emitClaudeSettings([
      'ponytail',
      'context7',
      'frontend-design',
    ]));

    const expected = {
      includeCoAuthoredBy: false,
      ...STATUS_LINES,
      enabledPlugins: {
        'linteljs@linteljs': true,
        'ponytail@ponytail': true,
        'context7@claude-plugins-official': true,
        'frontend-design@claude-plugins-official': true,
      },
      extraKnownMarketplaces: {
        'linteljs': {
          source: {
            source: 'directory',
            path: './plugins/linteljs',
          },
        },
        'ponytail': {
          source: {
            source: 'github',
            repo: 'DietrichGebert/ponytail',
          },
        },
        'claude-plugins-official': {
          source: {
            source: 'github',
            repo: 'anthropics/claude-plugins-official',
          },
        },
      },
    };
    expect(settings).toEqual(expected);
  });

  it('retains only the local LintelJS declaration with no selected plugins', () => {
    const settings: unknown = JSON.parse(emitClaudeSettings([]));

    const expected = {
      includeCoAuthoredBy: false,
      ...STATUS_LINES,
      enabledPlugins: { 'linteljs@linteljs': true },
      extraKnownMarketplaces: {
        linteljs: {
          source: {
            source: 'directory',
            path: './plugins/linteljs',
          },
        },
      },
    };
    expect(settings).toEqual(expected);
  });

  it.each(['context7', 'frontend-design'] as const)('declares the official marketplace for %s alone', (plugin) => {
    const output = emitClaudeSettings([plugin]);
    const settings: unknown = JSON.parse(output);

    const expected = {
      includeCoAuthoredBy: false,
      ...STATUS_LINES,
      enabledPlugins: {
        'linteljs@linteljs': true,
        [`${plugin}@claude-plugins-official`]: true,
      },
      extraKnownMarketplaces: {
        'linteljs': {
          source: {
            source: 'directory',
            path: './plugins/linteljs',
          },
        },
        'claude-plugins-official': {
          source: {
            source: 'github',
            repo: 'anthropics/claude-plugins-official',
          },
        },
      },
    };
    expect(settings).toEqual(expected);

    const actual = output.endsWith('\n');
    expect(actual).toBe(true);
  });
});

describe('claudeSettingsEmitter', () => {
  const CLAUDE: Answers = {
    ...DEFAULT_ANSWERS,
    agents: ['claude-code'],
  };

  it('writes nothing unless Claude Code was chosen', () => {
    const artifacts = claudeSettingsEmitter({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    });

    expect(artifacts).toEqual([]);
  });

  it('writes the adapter, the settings and the plugin manifests, and preserves only the adapter', () => {
    const written = claudeSettingsEmitter(CLAUDE)
      .map(({ target, preserve }) => {
        const shape = [target, preserve];

        return shape;
      });

    const expected = [
      ['CLAUDE.md', true],
      ['.claude/settings.json', undefined],
      ['plugins/linteljs/.claude-plugin/plugin.json', undefined],
      ['plugins/linteljs/.claude-plugin/marketplace.json', undefined],
      ['plugins/linteljs/hooks/hooks.json', undefined],
      ['plugins/linteljs/hooks/checkBand.tsx', undefined],
      ['plugins/linteljs/types/index.d.ts', undefined],
    ];
    expect(written).toEqual(expected);
  });

  it('ships the exact minimal local plugin metadata', async () => {
    const [
      ,
      ,
      plugin,
      marketplace,
    ] = claudeSettingsEmitter(CLAUDE);

    const pluginText = plugin === undefined ? '' : await shippedAssetsReader(plugin.content);

    expect(pluginText).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" },
  "types": "./types/index.d.ts"
}
`);

    const marketplaceText = marketplace === undefined ? '' : await shippedAssetsReader(marketplace.content);

    expect(marketplaceText).toBe(`{
  "name": "linteljs",
  "owner": { "name": "Faran Ali" },
  "plugins": [
    {
      "name": "linteljs",
      "source": "./",
      "description": "LintelJS project standards and safety hooks"
    }
  ]
}
`);
  });

  it('merges the settings a running project already holds, and writes its own where there are none', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      agents: ['claude-code'],
    };
    const settings = claudeSettingsEmitter(answers)
      .find(({ target }) => {
        return target === '.claude/settings.json';
      });

    const merge = settings !== undefined && 'merge' in settings.content
      ? settings.content.merge
      : () => {
          return '';
        };

    const merged: unknown = JSON.parse(merge(`${JSON.stringify({ enabledPlugins: { 'caveman@caveman': true } })}\n`));

    expect(merged).toHaveProperty('enabledPlugins', expect.objectContaining({
      'caveman@caveman': true,
      'linteljs@linteljs': true,
    }));

    const fresh = merge(null);
    expect(fresh).toBe(emitClaudeSettings(answers.plugins));
  });
});
