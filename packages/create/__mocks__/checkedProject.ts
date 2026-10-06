import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A git repository whose `package.json` has a `check` script, the project the commit gate guards.
export const checkedProject = (): string => {
  const prefix = join(tmpdir(), 'linteljs-checked-');
  const directory = mkdtempSync(prefix);
  const root = realpathSync(directory);
  const manifest = JSON.stringify({
    packageManager: 'pnpm@11.0.0',
    scripts: { check: 'true' },
  });

  execFileSync('/usr/bin/git', ['init', '--quiet'], { cwd: root });
  writeFileSync(join(root, 'package.json'), manifest);

  return root;
};

export const shellPayload = (cwd: string, command: string, event = 'PreToolUse'): object => {
  const payload = {
    cwd,
    hook_event_name: event,
    tool_name: 'Bash',
    tool_input: { command },
  };

  return payload;
};
