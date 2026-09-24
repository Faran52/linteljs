/**
 * PostToolUse(Edit|Write|apply_patch): runs the project's own scripts/checkBannedPatterns.ts over each file an agent
 * wrote, the same checker lint-staged runs on commit, and blocks with its findings. Stdout is the decision JSON or
 * nothing.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import {
  dirname,
  join,
  resolve,
} from 'node:path';

interface EditPayload {
  cwd: string;
  paths: string[];
}

type Field = 'command' | 'cwd' | 'file_path' | 'filePath' | 'patch' | 'tool_input' | 'tool_response';

type FieldValue = object | string | undefined;

const CHECKED = /\.(?:ts|tsx|mts|cts|vue|svelte)$/u;
const PATCHED_FILE = /^\*\*\* (?:Add|Update) File: (.+)$/u;
const CHECKER = join('scripts', 'checkBannedPatterns.ts');

// A payload is whatever the host sent, so a field is read only once it proves to be a string or an object.
const isFieldEntry = (entry: [string, unknown]): entry is [string, FieldValue] => {
  const [, field] = entry;
  return typeof field === 'string' || (typeof field === 'object' && field !== null);
};

const valueAt = (value: FieldValue, key: Field): FieldValue => {
  return typeof value === 'object' ? new Map(Object.entries(value).filter(isFieldEntry)).get(key) : undefined;
};

const stringAt = (value: FieldValue, key: Field): string | undefined => {
  const field = valueAt(value, key);
  return typeof field === 'string' ? field : undefined;
};

// Claude Code names the file; Codex's apply_patch carries the patch text, whose Add and Update headers name them.
const editedPaths = (payload: object): string[] => {
  const input = valueAt(payload, 'tool_input');
  const named = [stringAt(input, 'file_path'), stringAt(valueAt(payload, 'tool_response'), 'filePath')];
  const patch = stringAt(input, 'command') ?? stringAt(input, 'patch') ?? (typeof input === 'string' ? input : '');
  const patched = patch.split(/\r?\n/u).map((line) => {
    return PATCHED_FILE.exec(line)?.[1];
  });

  return [...named, ...patched].filter((path) => {
    return path !== undefined;
  });
};

// The process global rather than `node:process`, which sets stdin non-blocking and fails a large read.
const readPayload = (): EditPayload | undefined => {
  try {
    const payload: unknown = JSON.parse(readFileSync(0, 'utf8'));
    if (typeof payload !== 'object' || payload === null) {
      return undefined;
    }
    const cwd = stringAt(payload, 'cwd');
    return {
      cwd: resolve(cwd === undefined || cwd === '' ? '.' : cwd),
      paths: editedPaths(payload),
    };
  }
  catch {
    return undefined;
  }
};

// The payload's `cwd` is wherever the agent stands, which need not be the project root, so the checker is searched
// for upwards: from the root Claude Code exports where there is one, then from `cwd`, which is all Codex sends.
const checkerAbove = (start: string): string | undefined => {
  let directory = start;
  for (;;) {
    const candidate = join(directory, CHECKER);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
};

const findChecker = (cwd: string): string | undefined => {
  const projectDir = process.env['CLAUDE_PROJECT_DIR'];
  return (projectDir === undefined || projectDir === '' ? undefined : checkerAbove(projectDir)) ?? checkerAbove(cwd);
};

const decide = (): string | undefined => {
  const payload = readPayload();
  if (payload === undefined) {
    return undefined;
  }
  const files = new Set(payload.paths.map((path) => {
    return resolve(payload.cwd, path);
  }));

  for (const file of files) {
    if (!CHECKED.test(file) || !existsSync(file)) {
      continue;
    }
    // No checker anywhere above is a project with no floor to enforce, which is not a violation to report.
    const checker = findChecker(payload.cwd);
    if (checker === undefined) {
      return undefined;
    }
    const result = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
    if (result.status !== 0) {
      const findings = `${result.stdout}${result.stderr}`.trim();
      return `${file} now holds a banned pattern, so the edit was blocked. Build the real type instead of casting `
        + `or suppressing, then write the file again.\n${findings}`;
    }
  }
  return undefined;
};

const reason = decide();

if (reason !== undefined) {
  process.stdout.write(`${JSON.stringify({
    decision: 'block',
    reason,
  })}\n`);
}
