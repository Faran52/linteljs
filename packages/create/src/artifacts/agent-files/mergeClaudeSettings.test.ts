import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitClaudeSettings } from './emitClaudeSettings';
import { mergeClaudeSettings } from './mergeClaudeSettings';

// The merged shape as these tests read it: this CLI's two keys, plus the project ones above.
interface MergedSettings {
  includeCoAuthoredBy?: boolean;
  hooks?: { PreToolUse: { matcher: string }[] };
  enabledPlugins: Record<string, boolean>;
  extraKnownMarketplaces: Record<string, { source: { repo?: string;
    path?: string; }; }>;
}

const OURS = emitClaudeSettings(['context7']);

// What a project that has been running Claude Code for a while actually holds: a top-level key this
// CLI has never heard of, a hook, and plugins from marketplaces it does not know.
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

  // The existing case above holds a project that already answered `false`, which the default matches, so it cannot
  // tell precedence. This one can: the answer is the project's, and ours is only what it starts with.
  it('leaves a project that wants the trailer alone', () => {
    const merged = parsedMerge(`${JSON.stringify({ includeCoAuthoredBy: true })}\n`);

    expect(merged.includeCoAuthoredBy).toBe(true);
  });

  it('supplies the default to a project that has never set it', () => {
    const merged = parsedMerge(`${JSON.stringify({ enabledPlugins: { 'caveman@caveman': true } })}\n`);

    expect(merged.includeCoAuthoredBy).toBe(false);
  });

  // The failure this exists to stop: one sync used to take all three of these with it.
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

  // The plugins answer is the point of the file, so a declaration this CLI owns is not a project
  // opinion to defer to.
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

  // Blocking a sync on a file a person can fix in an editor helps nobody, and this reads a file
  // the project owns rather than one this CLI wrote.
  it('falls back to the emitted file when what is there is not usable', () => {
    expect(mergeClaudeSettings(OURS, '{ not json')).toBe(OURS);
    expect(mergeClaudeSettings(OURS, '["an array"]')).toBe(OURS);
    expect(mergeClaudeSettings(OURS, 'null')).toBe(OURS);
  });
});
