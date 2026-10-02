import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { spawnHook } from '@mocks/runHook';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

const WARNING = `${JSON.stringify({
  systemMessage: 'Context passed 150K (188K). Consider /compact or a fresh session.',
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: 'Context is 188K, past 150K. Tell the user so in one line, and keep replies lean.',
  },
})}\n`;

let directory: string;
let transcript: string;

const writeContext = (tokens: number): void => {
  const entry = {
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 0,
        cache_read_input_tokens: tokens,
        cache_creation_input_tokens: 0,
      },
    },
  };
  writeFileSync(transcript, `${JSON.stringify(entry)}\n`);
};

const run = (extra: object = {}, pluginData: string = directory): string => {
  return spawnHook('contextWarningHook.ts', {
    session_id: 's12a',
    transcript_path: transcript,
    hook_event_name: 'PostToolUse',
    ...extra,
  }, undefined, pluginData);
};

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'linteljs-context-hook-'));
  transcript = join(directory, 'main.jsonl');
});

afterEach(() => {
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});

describe('contextWarningHook.ts', () => {
  it('warns once past the ceiling, and again only after the context drops back under', () => {
    writeContext(188_000);

    const first = run();
    const second = run();
    writeContext(40_000);
    const under = run();
    writeContext(188_000);
    const again = run();

    const actual = [
      first,
      second,
      under,
      again,
    ];
    const expected = [
      WARNING,
      '',
      '',
      WARNING,
    ];
    expect(actual).toEqual(expected);
  });

  it('stays silent under the ceiling and leaves no marker', () => {
    writeContext(149_999);

    const output = run();

    expect(output).toBe('');
    const exists = existsSync(join(directory, 'linteljs-context-s12a'));
    expect(exists).toBe(false);
  });

  it('warns at exactly the ceiling', () => {
    writeContext(150_000);

    const output = run();

    expect(output).toContain('Context passed 150K (150K).');
  });

  it('does nothing for a subagent\'s tool call', () => {
    writeContext(188_000);

    const output = run({ agent_id: 'a1', agent_type: 'Explore' });

    expect(output).toBe('');
    const exists = existsSync(join(directory, 'linteljs-context-s12a'));
    expect(exists).toBe(false);
  });

  it('keeps its marker in tmp outside a plugin', () => {
    const session = `s12a-${String(Date.now())}`;
    const marker = join(tmpdir(), `linteljs-context-${session}`);
    writeContext(188_000);

    const output = spawnHook('contextWarningHook.ts', {
      session_id: session,
      transcript_path: transcript,
    });
    const marked = existsSync(marker);
    rmSync(marker, { force: true });

    expect(output).toBe(WARNING);
    expect(marked).toBe(true);
  });

  it('creates a plugin data directory that does not exist yet', () => {
    writeContext(188_000);

    const output = run({}, join(directory, 'data'));

    expect(output).toBe(WARNING);
    const exists = existsSync(join(directory, 'data', 'linteljs-context-s12a'));
    expect(exists).toBe(true);
  });

  it('stays silent on a payload it cannot read', () => {
    const output = spawnHook('contextWarningHook.ts', '{', undefined, directory);

    expect(output).toBe('');
  });
});
