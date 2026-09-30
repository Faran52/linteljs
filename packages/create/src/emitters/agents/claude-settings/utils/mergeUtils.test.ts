import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitClaudeSettings } from '../claudeSettingsEmitter';

import { mergeClaudeSettings } from './mergeUtils';

interface Matcher {
  matcher: string;
}

interface MergedHooks {
  PreToolUse: Matcher[];
}

interface MergedSource {
  repo?: string;
  path?: string;
}

interface MergedMarketplace {
  source: MergedSource;
}

interface MergedStatusLine {
  command: string;
}

interface MergedSettings {
  includeCoAuthoredBy?: boolean;
  statusLine?: MergedStatusLine;
  subagentStatusLine?: MergedStatusLine;
  hooks?: MergedHooks;
  enabledPlugins: Record<string, boolean>;
  extraKnownMarketplaces: Record<string, MergedMarketplace>;
}

const OURS = emitClaudeSettings(['context7']);

const THEIRS = `${JSON.stringify({
  includeCoAuthoredBy: false,
  hooks: {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [{
          type: 'command',
          command: 'bash ./guard.sh',
        }],
      },
    ],
  },
  enabledPlugins: { 'caveman@caveman': true },
  extraKnownMarketplaces: {
    caveman: {
      source: {
        source: 'github',
        repo: 'JuliusBrussee/caveman',
      },
    },
  },
}, null, 2)}\n`;

const isMergedSettings = (value: unknown): value is MergedSettings => {
  return typeof value === 'object' && value !== null && 'enabledPlugins' in value;
};

const parsedMerge = (current: string | null): MergedSettings => {
  const value: unknown = JSON.parse(mergeClaudeSettings(OURS, current));

  if (!isMergedSettings(value)) {
    throw new Error('merged settings are not an object with enabledPlugins');
  }

  return value;
};

describe('mergeClaudeSettings', () => {
  it('writes the emitted file unchanged when there is nothing on disk', () => {
    expect(mergeClaudeSettings(OURS, null)).toBe(OURS);
  });

  it('leaves a project that wants the trailer alone', () => {
    const merged = parsedMerge(`${JSON.stringify({ includeCoAuthoredBy: true })}\n`);

    expect(merged.includeCoAuthoredBy).toBe(true);
  });

  it('supplies the default to a project that has never set it', () => {
    const merged = parsedMerge(`${JSON.stringify({ enabledPlugins: { 'caveman@caveman': true } })}\n`);

    expect(merged.includeCoAuthoredBy).toBe(false);
  });

  it('wires both badges into a project that has no status line', () => {
    const merged = parsedMerge(THEIRS);
    const main = merged.statusLine?.command;
    const subagent = merged.subagentStatusLine?.command;

    expect(main).toContain('mainStatusLine.ts');
    expect(subagent).toContain('subagentStatusLine.ts');
  });

  it("leaves a project's own status lines alone", () => {
    const own = { command: 'bash ./mine.sh' };
    const merged = parsedMerge(`${JSON.stringify({
      statusLine: own,
      subagentStatusLine: own,
    })}\n`);

    expect(merged.statusLine).toEqual(own);
    expect(merged.subagentStatusLine).toEqual(own);
  });

  it('keeps the keys the project owns', () => {
    const merged = parsedMerge(THEIRS);

    expect(merged.includeCoAuthoredBy).toBe(false);
    expect(merged.hooks?.PreToolUse[0]?.matcher).toBe('Bash');
    expect(merged.enabledPlugins['caveman@caveman']).toBe(true);
    expect(merged.extraKnownMarketplaces['caveman']?.source.repo).toBe('JuliusBrussee/caveman');
  });

  it('adds its own entries alongside them', () => {
    const merged = parsedMerge(THEIRS);

    expect(merged.enabledPlugins['linteljs@linteljs']).toBe(true);
    expect(merged.enabledPlugins['context7@claude-plugins-official']).toBe(true);
    expect(merged.extraKnownMarketplaces['linteljs']?.source.path).toBe('./plugins/linteljs');
  });

  it('wins on an entry both sides declare', () => {
    const stale = `${JSON.stringify({
      enabledPlugins: { 'linteljs@linteljs': false },
      extraKnownMarketplaces: {
        linteljs: {
          source: {
            source: 'github',
            repo: 'wrong/place',
          },
        },
      },
    })}\n`;

    const merged = parsedMerge(stale);

    expect(merged.enabledPlugins['linteljs@linteljs']).toBe(true);
    expect(merged.extraKnownMarketplaces['linteljs']?.source.path).toBe('./plugins/linteljs');
  });

  it('falls back to the emitted file when what is there is not usable', () => {
    expect(mergeClaudeSettings(OURS, '{ not json')).toBe(OURS);
    expect(mergeClaudeSettings(OURS, '["an array"]')).toBe(OURS);
    expect(mergeClaudeSettings(OURS, 'null')).toBe(OURS);
  });
});
