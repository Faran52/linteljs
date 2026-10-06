import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { dependencyReason } from './dependencyUtils.ts';

let cwd = '';

const MANIFEST = '{\n  "dependencies": {\n    "react": "^19.0.0"\n  }\n}\n';

const shell = (command: string, tool = 'Bash'): object => {
  const payload = {
    cwd,
    hook_event_name: 'PreToolUse',
    tool_name: tool,
    tool_input: { command },
  };

  return payload;
};

const edit = (toolInput: object): object => {
  const payload = {
    cwd,
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: toolInput,
  };

  return payload;
};

const reasonOf = (changes: string): string => {
  return `This adds or removes dependencies: ${changes}. Approve it only if that change was asked for.`;
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'linteljs-dependency-');
  cwd = mkdtempSync(prefix);
  writeFileSync(join(cwd, 'package.json'), MANIFEST);
});

afterEach(() => {
  rmSync(cwd, {
    force: true,
    recursive: true,
  });
});

describe('dependencyReason on a command', () => {
  it.each([
    ['pnpm add -D vitest', 'vitest'],
    ['npm i lodash@4', 'lodash@4'],
    ['npm install --save-dev typescript', 'typescript'],
    ['yarn remove react', 'react'],
    ['bun rm a b', 'a, b'],
    ['pnpm --filter web add zod', 'zod'],
    ['pnpm add --filter web zod', 'zod'],
    ['pnpm -C packages/app un left-pad', 'left-pad'],
    ['npm uninstall --prefix app chalk', 'chalk'],
    ['cd app && npm rm x && yarn add y', 'x, y'],
    ['/usr/local/bin/pnpm add -w zod', 'zod'],
  ])('asks before `%s`', (command, changes) => {
    const reason = dependencyReason(shell(command));
    expect(reason).toBe(reasonOf(changes));
  });

  it.each([
    'pnpm install',
    'npm i',
    'pnpm install --frozen-lockfile',
    'pnpm add',
    'pnpm --filter',
    'pnpm test add',
    'npx add x',
    'git add package.json',
    'echo "pnpm add x"',
    'pnpm add "unterminated',
  ])('lets `%s` through', (command) => {
    const reason = dependencyReason(shell(command));
    expect(reason).toBeUndefined();
  });

  it('reads a PowerShell command, and Copilot\'s and Cursor\'s shell calls', () => {
    const powershell = dependencyReason(shell('pnpm add zod', 'PowerShell'));
    const copilot = dependencyReason({
      cwd,
      toolName: 'bash',
      toolArgs: '{"command":"pnpm add zod"}',
    });
    const cursor = dependencyReason({
      command: 'pnpm add zod',
      cursor_version: '2.4.0',
      cwd,
      hook_event_name: 'beforeShellExecution',
    });

    expect([
      powershell,
      copilot,
      cursor,
    ]).toEqual([
      reasonOf('zod'),
      reasonOf('zod'),
      reasonOf('zod'),
    ]);
  });
});

describe('dependencyReason on an edit', () => {
  it('asks before an edit that adds or removes a dependency, naming its section', () => {
    const added = dependencyReason(edit({
      file_path: 'package.json',
      old_string: '"react": "^19.0.0"',
      new_string: '"react": "^19.0.0",\n    "zod": "^4.0.0"',
    }));
    const removed = dependencyReason(edit({
      file_path: join(cwd, 'package.json'),
      content: '{}',
    }));

    expect(added).toBe(reasonOf('zod (dependencies)'));
    expect(removed).toBe(reasonOf('react (dependencies)'));
  });

  it('reads a move between sections as both a removal and an addition', () => {
    const reason = dependencyReason(edit({
      file_path: 'package.json',
      content: '{"devDependencies":{"react":"^19.0.0"},"peerDependencies":{"react":"*"}}',
    }));

    expect(reason).toBe(reasonOf('react (devDependencies), react (peerDependencies), react (dependencies)'));
  });

  it('applies every replacement when the edit replaces all, and reads `$&` as text', () => {
    writeFileSync(join(cwd, 'package.json'), '{"dependencies":{"a":"1"},"devDependencies":{"a":"1"}}');
    const all = dependencyReason(edit({
      file_path: 'package.json',
      old_string: '"a"',
      new_string: '"$&"',
      replace_all: true,
    }));
    const once = dependencyReason(edit({
      file_path: 'package.json',
      old_string: '"a"',
      new_string: '"b"',
    }));

    expect(all).toBe(reasonOf('$& (dependencies), $& (devDependencies), a (dependencies), a (devDependencies)'));
    expect(once).toBe(reasonOf('b (dependencies), a (dependencies)'));
  });

  it('reads a manifest being created from none, and Copilot\'s own field names', () => {
    rmSync(join(cwd, 'package.json'));
    const created = dependencyReason({
      cwd,
      toolName: 'create',
      toolArgs: JSON.stringify({
        path: 'package.json',
        file_text: '{"dependencies":{"zod":"4"}}',
      }),
    });
    writeFileSync(join(cwd, 'package.json'), MANIFEST);
    const edited = dependencyReason({
      cwd,
      toolName: 'edit',
      toolArgs: JSON.stringify({
        command: 'str_replace',
        path: 'package.json',
        old_str: '"react"',
        new_str: '"preact"',
      }),
    });

    expect(created).toBe(reasonOf('zod (dependencies)'));
    expect(edited).toBe(reasonOf('preact (dependencies), react (dependencies)'));
  });

  it.each([
    [
      'a version bump',
      {
        file_path: 'package.json',
        old_string: '^19.0.0',
        new_string: '^19.1.0',
      },
    ],
    [
      'another file',
      {
        file_path: 'tsconfig.json',
        content: '{"dependencies":{"zod":"4"}}',
      },
    ],
    [
      'no path',
      { content: '{}' },
    ],
    [
      'an edit with no text',
      { file_path: 'package.json' },
    ],
    [
      'an edit that leaves invalid JSON',
      {
        file_path: 'package.json',
        content: '{',
      },
    ],
    [
      'a section that is no object',
      {
        file_path: 'package.json',
        content: '{"dependencies":{"react":"^19.0.0"},"devDependencies":"none"}',
      },
    ],
  ])('lets %s through', (_label, toolInput) => {
    const reason = dependencyReason(edit(toolInput));
    expect(reason).toBeUndefined();
  });

  it('lets an edit through when the manifest on disk is not JSON', () => {
    writeFileSync(join(cwd, 'package.json'), '{');
    const reason = dependencyReason(edit({
      file_path: 'package.json',
      content: '{"dependencies":{"zod":"4"}}',
    }));

    expect(reason).toBeUndefined();
  });

  it('reads no edit under Cursor, whose edit event cannot ask', () => {
    const reason = dependencyReason({
      cursor_version: '2.4.0',
      cwd,
      hook_event_name: 'preToolUse',
      tool_name: 'Write',
      tool_input: {
        file_path: 'package.json',
        content: '{}',
      },
    });

    expect(reason).toBeUndefined();
  });

  it('resolves a relative path against no directory when the payload names none', () => {
    const reason = dependencyReason({
      tool_name: 'Write',
      tool_input: {
        file_path: join(cwd, 'package.json'),
        content: '{}',
      },
    });

    expect(reason).toBe(reasonOf('react (dependencies)'));
  });
});
