import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { claudeSettingsEmitter, emitClaudeSettings } from './claudeSettingsEmitter';

import type { Answers } from '@config/types';

describe('emitClaudeSettings', () => {
  it('enables every selected plugin with its required marketplace', () => {
    const settings: unknown = JSON.parse(emitClaudeSettings([
      'ponytail',
      'context7',
      'frontend-design',
    ]));

    expect(settings).toEqual({
      includeCoAuthoredBy: false,
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
    });
  });

  it('retains only the local LintelJS declaration with no selected plugins', () => {
    const settings: unknown = JSON.parse(emitClaudeSettings([]));

    expect(settings).toEqual({
      includeCoAuthoredBy: false,
      enabledPlugins: { 'linteljs@linteljs': true },
      extraKnownMarketplaces: {
        linteljs: {
          source: {
            source: 'directory',
            path: './plugins/linteljs',
          },
        },
      },
    });
  });

  it.each(['context7', 'frontend-design'] as const)('declares the official marketplace for %s alone', (plugin) => {
    const output = emitClaudeSettings([plugin]);
    const settings: unknown = JSON.parse(output);

    expect(settings).toEqual({
      includeCoAuthoredBy: false,
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
    });
    expect(output.endsWith('\n')).toBe(true);
  });
});

describe('claudeSettingsEmitter', () => {
  const CLAUDE: Answers = {
    ...DEFAULT_ANSWERS,
    agents: ['claude-code'],
  };

  it('writes nothing unless Claude Code was chosen', () => {
    expect(claudeSettingsEmitter({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    })).toEqual([]);
  });

  /*
   * The adapter is the project's once it exists; the settings file is linteljs's, and it is the one merge `sync` may
   * still remove, since the whole file exists because this host was selected.
   */
  it('writes the adapter, the settings and the plugin manifests, and owns all but the adapter', () => {
    expect(claudeSettingsEmitter(CLAUDE).map(({
      target,
      preserve,
      removable,
    }) => {
      return [target, preserve, removable];
    })).toEqual([
      ['CLAUDE.md', true, undefined],
      ['.claude/settings.json', undefined, true],
      ['plugins/linteljs/.claude-plugin/plugin.json', undefined, undefined],
      ['plugins/linteljs/.claude-plugin/marketplace.json', undefined, undefined],
    ]);
  });

  // Hooks come through conventional discovery, so neither manifest names them.
  it('ships the exact minimal local plugin metadata', async () => {
    const [, , plugin, marketplace] = claudeSettingsEmitter(CLAUDE);

    expect(plugin === undefined ? '' : await shippedAssetsReader(plugin.content)).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" }
}
`);
    expect(marketplace === undefined ? '' : await shippedAssetsReader(marketplace.content)).toBe(`{
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

  // Through the artifact, so what is on disk is what the merge is handed.
  it('merges the settings a running project already holds, and writes its own where there are none', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      agents: ['claude-code'],
    };
    const settings = claudeSettingsEmitter(answers).find(({ target }) => {
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
    expect(merge(null)).toBe(emitClaudeSettings(answers.plugins));
  });
});
