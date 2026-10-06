// Asks, never denies: adding a dependency is often the task, so the person decides each time.
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
  commandName,
  type Dialect,
  parseCommand,
  type ParsedCommand,
  skipOptions,
} from './commandParserUtils.ts';
import {
  fieldAt,
  hostOf,
  type Json,
  jsonObjectOf,
  readCommand,
  stringAt,
  toolInputOf,
} from './hostUtils.ts';

const MANAGERS = new Set([
  'bun',
  'npm',
  'pnpm',
  'yarn',
]);

const CHANGES = new Set<string | undefined>([
  'add',
  'i',
  'install',
  'remove',
  'rm',
  'un',
  'uninstall',
]);

// Options whose value is the next token, so the value is not read as a package. pnpm's `-w` takes none.
const VALUED = new Set([
  '-C',
  '--cwd',
  '--dir',
  '-F',
  '--filter',
  '--prefix',
  '--workspace',
]);

const SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

const packagesOf = (arguments_: string[]): string[] => {
  const packages: string[] = [];
  let operand = false;

  for (const argument of arguments_) {
    if (!operand && !argument.startsWith('-')) {
      packages.push(argument);
    }

    operand = !operand && VALUED.has(argument);
  }

  return packages;
};

// A bare `install` changes no dependency: it installs what the manifest already lists.
const changedBy = ({ tokens }: ParsedCommand): string[] => {
  const name = commandName(tokens[0]);
  const index = MANAGERS.has(name) ? skipOptions(tokens, 1, VALUED) : undefined;

  if (index === undefined || !CHANGES.has(tokens[index])) {
    return [];
  }

  const arguments_ = tokens.slice(index + 1);
  return packagesOf(arguments_);
};

const commandChanges = (command: string, dialect: Dialect): string[] => {
  const commands = parseCommand(command, dialect) ?? [];
  return commands.flatMap(changedBy);
};

const namesOf = (text: string): Set<string> | undefined => {
  const manifest = jsonObjectOf(() => {
    return text;
  });

  if (manifest === undefined) {
    return undefined;
  }

  const names = SECTIONS
    .flatMap((section) => {
      const dependencies = fieldAt(manifest, section);

      return typeof dependencies === 'object'
        ? Object.keys(dependencies)
            .map((name) => {
              return `${name} (${section})`;
            })
        : [];
    });

  return new Set(names);
};

// A function replacement, so a `$&` in the new text is not read as a pattern. Copilot's tools spell the fields
// `file_text`, `old_str` and `new_str`.
const editedText = (input: Json | undefined, current: string): string | undefined => {
  const content = stringAt(input, 'content') ?? stringAt(input, 'file_text');
  const oldString = stringAt(input, 'old_string') ?? stringAt(input, 'old_str');
  const newString = stringAt(input, 'new_string') ?? stringAt(input, 'new_str');

  if (content !== undefined || oldString === undefined || newString === undefined) {
    return content;
  }

  const replacement = (): string => {
    return newString;
  };

  const everywhere = typeof input === 'object' && Reflect.get(input, 'replace_all') === true;

  return everywhere ? current.replaceAll(oldString, replacement) : current.replace(oldString, replacement);
};

const readText = (path: string): string => {
  try {
    return readFileSync(path, 'utf8');
  }
  catch {
    // A manifest being created starts from none.
  }

  return '{}';
};

// Cursor's edit event cannot ask, so its edits are not read.
const editChanges = (payload: object): string[] => {
  const host = hostOf(payload);
  const input = toolInputOf(payload, host);
  const path = stringAt(input, 'file_path') ?? stringAt(input, 'path');

  if (host === 'cursor' || path === undefined || basename(path) !== 'package.json') {
    return [];
  }

  const current = readText(resolve(stringAt(payload, 'cwd') ?? '', path));
  const before = namesOf(current);
  const after = namesOf(editedText(input, current) ?? '');

  if (before === undefined || after === undefined) {
    return [];
  }

  const added = [...after]
    .filter((name) => {
      return !before.has(name);
    });
  const removed = [...before]
    .filter((name) => {
      return !after.has(name);
    });
  const changes = [...added, ...removed];

  return changes;
};

// Both are read whatever the tool: Copilot's edit tool sends a `command` too, which no manager runs.
export const dependencyReason = (payload: object): string | undefined => {
  const input = readCommand(payload, 'beforeShellExecution');
  const changes = [
    ...input === undefined ? [] : commandChanges(input.command, input.dialect),
    ...editChanges(payload),
  ];

  return changes.length === 0
    ? undefined
    : `This adds or removes dependencies: ${changes.join(', ')}. Approve it only if that change was asked for.`;
};
