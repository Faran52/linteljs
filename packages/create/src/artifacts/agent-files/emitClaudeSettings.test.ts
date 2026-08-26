import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitClaudeSettings } from './emitClaudeSettings';

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

  it('declares the shared official marketplace once for one official plugin', () => {
    const output = emitClaudeSettings(['context7']);
    const settings: unknown = JSON.parse(output);

    expect(settings).toEqual({
      includeCoAuthoredBy: false,
      enabledPlugins: {
        'linteljs@linteljs': true,
        'context7@claude-plugins-official': true,
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
