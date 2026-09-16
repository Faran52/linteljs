import {
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chdir,
  cwd as processCwd,
  stdin,
  stdout,
} from 'node:process';

import { plantBinary } from '@mocks/plantBinary';
import {
  CANCEL,
  type Recorded,
  scripted,
} from '@mocks/scriptedPrompter';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { parsePackageJson } from '../../artifacts/package-json/emitPackageJson';
import { type Answers, DEFAULT_ANSWERS } from '../../model/answers/answers';
import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  emitLintelConfig,
  parseLintelConfig,
} from '../../model/config/lintelConfig';
import { NOTHING_ANSWERED_MESSAGE, RUN_CANCELLED_MESSAGE } from '../prompts/prompts';
import { exists } from '../utils/fsUtils';

import { main, parseCliArgs } from './cli';

interface Run {
  code: number;
  printed: string;
  errors: string[];
}

const RULE = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

let project = '';
let entered = '';
let external = '';

// `parseCliArgs` reads `process.cwd()`.
beforeEach(async () => {
  entered = processCwd();
  project = await mkdtemp(join(tmpdir(), 'lintel-cli-'));
  external = await mkdtemp(join(tmpdir(), 'lintel-cli-external-'));
  chdir(project);
});

afterEach(async () => {
  chdir(entered);
  await rm(project, {
    recursive: true,
    force: true,
  });
  await rm(external, {
    recursive: true,
    force: true,
  });
});

const runMain = async (argv: string[], recorded?: Recorded): Promise<Run> => {
  const chunks: string[] = [];
  const errors: string[] = [];
  const printing = vi.spyOn(stdout, 'write').mockImplementation((chunk) => {
    chunks.push(String(chunk));

    return true;
  });
  const reporting = vi.spyOn(console, 'error').mockImplementation((message: string) => {
    errors.push(message);
  });

  try {
    const code = await main(argv, recorded?.prompter);

    return {
      code,
      printed: chunks.join(''),
      errors,
    };
  }
  finally {
    printing.mockRestore();
    reporting.mockRestore();
  }
};

const generated = async (): Promise<Run> => {
  return await runMain(['--skip-scaffold', '--no-install', '--yes']);
};

const configAt = async (): Promise<ReturnType<typeof parseLintelConfig>> => {
  return parseLintelConfig(await readFile(join(project, CONFIG_PATH), 'utf8'));
};

const writeConfig = async (answers: Answers): Promise<void> => {
  await writeFile(join(project, CONFIG_PATH), emitLintelConfig(answers), 'utf8');
};

const readOptional = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

describe('parseCliArgs', () => {
  it('turns --skip-scaffold into a skipped scaffold stage', () => {
    expect(parseCliArgs(['demo-app', '--skip-scaffold']).skip).toEqual(['scaffold']);
  });

  it('turns --no-install into skipping both the install and the fix that needs it', () => {
    // `parseArgs` has no `--no-` negation; the flag is declared under its literal name.
    expect(parseCliArgs(['demo-app', '--no-install']).skip).toEqual(['install', 'fix']);
  });

  it('carries --fresh through for a directory the CLI did not scaffold', () => {
    expect(parseCliArgs(['--skip-scaffold', '--fresh']).fresh).toBe(true);
    expect(parseCliArgs(['--skip-scaffold']).fresh).toBe(false);
  });

  it('reads sync as a command rather than a project name', () => {
    const options = parseCliArgs(['sync', '--force']);

    expect(options.command).toBe('sync');
    expect(options.name).toBe('');
    expect(options.force).toBe(true);
  });

  // Reported and stopped rather than dropped, so the run that happens is the one asked for.
  it('keeps a stage name it does not know, rather than dropping it', () => {
    const options = parseCliArgs(['demo-app', '--skip', 'standard', '--skip', 'nonsense']);

    expect(options.skip).toEqual(['standard']);
    expect(options.unknownSkips).toEqual(['nonsense']);
  });

  it('reports nothing unknown for a valid skip list', () => {
    expect(parseCliArgs(['demo-app', '--skip', 'standard']).unknownSkips).toEqual([]);
  });

  it('keeps extra positional arguments for main to reject', () => {
    expect(parseCliArgs(['demo-app', 'extra']).unexpectedArguments).toEqual(['extra']);
    expect(parseCliArgs(['sync', 'extra']).unexpectedArguments).toEqual(['extra']);
  });
});

// stdout, not stderr: `create --help | grep skip` would print nothing otherwise.
describe('main: what it prints and what it returns', () => {
  it('prints the usage to stdout and succeeds', async () => {
    const { code, printed } = await runMain(['--help']);

    expect(code).toBe(0);
    expect(printed).toContain('--skip-scaffold');
  });

  it('fails on a stage name it does not know, before writing anything', async () => {
    const { code, errors } = await runMain(['demo-app', '--skip', 'lnt']);

    expect(code).toBe(1);
    expect(errors).toEqual([expect.stringContaining('Not a stage: lnt')]);
    expect(errors[0]).toContain('scaffold, lint, package, standard, install, fix');
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  it.each([
    ['an invalid project name', ['My-App', '--skip-scaffold', '--no-install', '--yes'], 'Project name must be'],
    ['an extra create argument', ['demo-app', 'extra', '--yes'], 'Unexpected argument: extra'],
    ['extra create arguments', ['demo-app', 'extra', 'more', '--yes'], 'Unexpected arguments: extra, more'],
    ['an extra sync argument', ['sync', 'extra'], 'Unexpected argument: extra'],
    ['an unknown option', ['--wat'], "Unknown option '--wat'"],
  ])('fails on %s before writing anything', async (_case, argv, message) => {
    const { code, errors } = await runMain(argv);

    expect(code).toBe(1);
    // The line opens with what a user has to act on, not the `TypeError [ERR_PARSE_ARGS_UNKNOWN_OPTION]` class name.
    expect(errors).toHaveLength(1);
    expect(errors[0]?.startsWith(message)).toBe(true);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  // `mkdir demo-app && cd demo-app && create --yes` scaffolds into it under its own name.
  it('scaffolds into the directory it stands in when --yes gave no name', async () => {
    const named = join(project, 'demo-app');

    await mkdir(named);
    chdir(named);
    await plantBinary(join(project, 'fake-bin'), 'pnpm', [
      "require('node:fs').mkdirSync(process.argv[4], { recursive: true });",
    ]);

    try {
      const { code } = await runMain(['--no-install', '--yes']);

      expect(code).toBe(0);
      expect(parsePackageJson(await readFile(join(named, 'package.json'), 'utf8')).name).toBe('demo-app');
    }
    finally {
      await rm(join(project, 'fake-bin'), {
        recursive: true,
        force: true,
      });
    }
  });

  // The name is a question, so a bare run is refused only because there is no terminal to ask it on.
  it('asks for a missing name rather than requiring it, and still refuses with no terminal', async () => {
    const { code, errors } = await runMain([]);

    expect(code).toBe(1);
    expect(errors.join('\n')).not.toContain('A project name is required');
    expect(errors).toEqual([expect.stringContaining('answer every question')]);
  });

  // `--skip-scaffold` patches a directory that is already named.
  it('does not ask the name when there is no directory to create', async () => {
    const asked = scripted([
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    await runMain(['--skip-scaffold', '--no-install'], asked);

    expect(asked.calls).not.toContain('Project name');
  });
});

// Quitting on purpose is not a failure: no "Error:" prefix, exit 130 rather than 1.
describe('main: cancelled mid-questionnaire', () => {
  it('prints a calm message and exits 130, with nothing written and nothing on stderr', async () => {
    const {
      code,
      printed,
      errors,
    } = await runMain(
      ['--skip-scaffold', '--no-install'],
      scripted([CANCEL]),
    );

    expect(code).toBe(130);
    expect(printed).toContain(RUN_CANCELLED_MESSAGE);
    expect(printed).not.toContain('answer every question');
    expect(errors).toEqual([]);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  it('is reachable after some real answers, not only on the first question', async () => {
    const { code } = await runMain(
      ['--skip-scaffold', '--no-install'],
      scripted(['svelte', undefined, undefined, CANCEL]),
    );

    expect(code).toBe(130);
  });
});

describe('main: create', () => {
  it('patches the directory it is run in and reports every file it wrote', async () => {
    const { code, printed } = await generated();

    expect(code).toBe(0);
    expect(printed).toContain('wrote eslint.config.js');
    expect(printed).toContain(`wrote ${RULE}`);
    expect(printed).toContain(`wrote ${CONFIG_PATH}`);
    expect(printed).toContain('Done. Next:\n  pnpm install\n  pnpm lint:fix\n  pnpm check');
    expect(await exists(join(project, 'eslint.config.js'))).toBe(true);
    expect(await configAt()).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });

  // With `--skip-scaffold` the directory's own name is what package.json keeps calling it.
  it('names the project after the directory when no name was given', async () => {
    await generated();

    const patched = parsePackageJson(await readFile(join(project, 'package.json'), 'utf8'));

    expect(patched.name).toContain('lintel-cli-');
    expect(await readFile(join(project, 'CLAUDE.md'), 'utf8')).toContain('# LintelJS project');
  });

  it('runs the questionnaire and writes both selected adapters when --yes was not passed', async () => {
    const { printed } = await runMain(
      ['--skip-scaffold', '--no-install'],
      scripted(['svelte', undefined, undefined, ['zod'], undefined, undefined, ['claude-code', 'codex'], []]),
    );

    const patched = parsePackageJson(await readFile(join(project, 'package.json'), 'utf8'));

    expect(patched).not.toHaveProperty('lintel');
    expect(await configAt()).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
      target: 'svelte',
      libraries: ['zod'],
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
    expect(printed).toContain('wrote CLAUDE.md');
    expect(printed).toContain('wrote AGENTS.md');
    expect(printed).toContain('wrote plugins/linteljs/skills/linteljs/references/svelte-reactivity.md');
  });

  it('scaffolds into the name the questionnaire gave when no argument did', async () => {
    await plantBinary(join(project, 'fake-bin'), 'pnpm', [
      "require('node:fs').mkdirSync(process.argv[4], { recursive: true });",
    ]);

    const asked = scripted([
      'asked-app', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    try {
      const { code } = await runMain(['--no-install'], asked);

      expect(code).toBe(0);
      expect(asked.calls[0]).toContain('Project name');
      expect(await exists(join(project, 'asked-app', 'eslint.config.js'))).toBe(true);

      const patched = parsePackageJson(
        await readFile(join(project, 'asked-app', 'package.json'), 'utf8'),
      );

      expect(patched.name).toBe('asked-app');
    }
    finally {
      await rm(join(project, 'fake-bin'), {
        recursive: true,
        force: true,
      });
    }
  });

  // Wrong, the whole standard lands one level too high.
  it('patches the directory the scaffolder made, not the one it was run from', async () => {
    await plantBinary(join(project, 'fake-bin'), 'pnpm', [
      "require('node:fs').mkdirSync(process.argv[4], { recursive: true });",
    ]);

    try {
      const { code, printed } = await runMain(['demo-app', '--no-install', '--yes']);

      expect(code).toBe(0);
      expect(printed).toContain('wrote eslint.config.js');
      expect(await exists(join(project, 'demo-app', 'eslint.config.js'))).toBe(true);
      expect(await exists(join(project, 'eslint.config.js'))).toBe(false);

      const patched = parsePackageJson(
        await readFile(join(project, 'demo-app', 'package.json'), 'utf8'),
      );

      expect(patched.name).toBe('demo-app');
      expect(patched).not.toHaveProperty('lintel');
      expect(parseLintelConfig(
        await readFile(join(project, 'demo-app', CONFIG_PATH), 'utf8'),
      )).toMatchObject(DEFAULT_ANSWERS);
    }
    finally {
      vi.unstubAllEnvs();
    }
  });

  it('names the project after the argument even where no scaffolder ran', async () => {
    const { printed } = await runMain(['demo-app', '--skip-scaffold', '--no-install', '--yes']);

    expect(printed).toContain('wrote package.json');
    expect(parsePackageJson(await readFile(join(project, 'package.json'), 'utf8')).name)
      .toBe('demo-app');
  });

  it('accepts every default without asking when --yes was passed', async () => {
    const asked = scripted([]);

    await runMain(['--skip-scaffold', '--no-install', '--yes'], asked);

    expect(asked.calls).toEqual([]);
    expect(await configAt()).toMatchObject(DEFAULT_ANSWERS);
  });
});

// Behind a pipe, EOF reads as the default answer; unguarded this rewrote the project as React for four of seven agents.
describe('main: patching a project that already exists', () => {
  const asSvelte = async (): Promise<void> => {
    await runMain(
      ['--skip-scaffold', '--no-install'],
      scripted([
        'svelte',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ]),
    );
  };

  it('plans from what the project recorded rather than asking again', async () => {
    await asSvelte();

    const asked = scripted([]);
    const { code, printed } = await runMain(['--skip-scaffold', '--no-install'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(printed).toContain('wrote plugins/linteljs/skills/linteljs/references/svelte-reactivity.md');
    expect((await configAt()).target).toBe('svelte');
  });

  it('keeps the recorded target under --yes, which declines the questions not the record', async () => {
    await asSvelte();
    await runMain(['--skip-scaffold', '--no-install', '--yes']);

    const patched = parsePackageJson(await readFile(join(project, 'package.json'), 'utf8'));

    expect(patched).not.toHaveProperty('lintel');
    expect((await configAt()).target).toBe('svelte');
    expect(await exists(join(
      project,
      'plugins/linteljs/skills/linteljs/references/svelte-reactivity.md',
    ))).toBe(true);
  });

  it('writes nothing when nobody answered, rather than defaulting to react', async () => {
    const { code, errors } = await runMain(['--skip-scaffold', '--no-install'], scripted([]));

    expect(code).toBe(1);
    expect(errors).toEqual([`Error: ${NOTHING_ANSWERED_MESSAGE}`]);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
    expect(await exists(join(project, 'package.json'))).toBe(false);
    expect(await exists(join(project, CONFIG_PATH))).toBe(false);
  });

  it('stops on a script that answers some of the questions and then runs out', async () => {
    const { code } = await runMain(['--skip-scaffold', '--no-install'], scripted(['svelte', undefined]));

    expect(code).toBe(1);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  it.each([
    ['malformed', '{', 'lintel.config.json is not valid JSON'],
    [
      'invalid',
      emitLintelConfig(DEFAULT_ANSWERS).replace('"target": "react"', '"target": "ember"'),
      'target must be one of:',
    ],
  ])('rejects a scaffold-skipped %s config before prompts or writes', async (_case, config, message) => {
    const packageText = '{"name":"kept"}\n';
    const asked = scripted([]);

    await writeFile(join(project, 'package.json'), packageText, 'utf8');
    await writeFile(join(project, CONFIG_PATH), config, 'utf8');

    const {
      code,
      errors,
      printed,
    } = await runMain(
      ['--skip-scaffold', '--no-install'],
      asked,
    );

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain(message);
    expect(asked.calls).toEqual([]);
    expect(printed).not.toContain('wrote ');
    await expect(readFile(join(project, 'package.json'), 'utf8')).resolves.toBe(packageText);
    await expect(readFile(join(project, CONFIG_PATH), 'utf8')).resolves.toBe(config);
    await expect(exists(join(project, 'eslint.config.js'))).resolves.toBe(false);
  });
});

// The one place `main` reads the real `process.stdin`, so `stdin.isTTY` is stubbed rather than faked by a prompter.
describe('main: no prompter injected, so the real terminal decides', () => {
  afterEach(() => {
    stdin.isTTY = false;
  });

  it('refuses to guess when there is no terminal and --yes was not passed', async () => {
    stdin.isTTY = false;

    const { code, errors } = await runMain(['--skip-scaffold', '--no-install']);

    expect(code).toBe(1);
    expect(errors).toEqual([`Error: ${NOTHING_ANSWERED_MESSAGE}`]);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  it('needs no terminal when --yes is passed, even with one attached', async () => {
    stdin.isTTY = true;

    const { code } = await runMain(['--skip-scaffold', '--no-install', '--yes']);

    expect(code).toBe(0);
    expect(await configAt()).toMatchObject(DEFAULT_ANSWERS);
  });
});

describe('main: config entry safety', () => {
  it.each([
    ['create', 'live', ['--skip-scaffold', '--no-install'], emitLintelConfig(DEFAULT_ANSWERS)],
    ['create', 'dangling', ['--skip-scaffold', '--no-install'], null],
    ['sync', 'live', ['sync', '--force'], emitLintelConfig(DEFAULT_ANSWERS)],
    ['sync', 'dangling', ['sync', '--force'], null],
  ])('%s rejects a %s config symlink before prompts or writes', async (
    _route,
    _case,
    argv,
    original,
  ) => {
    const packageText = '{"name":"kept"}\n';
    const target = join(external, 'actual-config.json');
    const configPath = join(project, CONFIG_PATH);
    const asked = scripted([]);

    await writeFile(join(project, 'package.json'), packageText, 'utf8');

    if (original !== null) {
      await writeFile(target, original, 'utf8');
    }

    await symlink(target, configPath);

    const {
      code,
      errors,
      printed,
    } = await runMain(argv, asked);

    expect(code).toBe(1);
    expect(errors).toEqual([
      'Error: lintel.config.json must be a regular file; symbolic links are not allowed',
    ]);
    expect(asked.calls).toEqual([]);
    expect(printed).not.toContain('wrote ');
    await expect(readFile(join(project, 'package.json'), 'utf8')).resolves.toBe(packageText);
    await expect(readlink(configPath)).resolves.toBe(target);
    await expect(readOptional(target)).resolves.toBe(original);
  });
});

describe('main: sync', () => {
  it('reports nothing to do for a project it just generated', async () => {
    await generated();

    const asked = scripted([]);
    const { code, printed } = await runMain(['sync', '--yes'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(printed).toContain('Everything is already up to date.');
  });

  it('shows the diff and writes nothing without --force', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const { printed } = await runMain(['sync', '--yes']);

    expect(printed).toContain(`${RULE}: changed`);
    expect(printed).toContain('local edit');
    expect(printed).toContain('Re-run with --force');
    expect(await readFile(join(project, RULE), 'utf8')).toBe('# local edit\n');
  });

  it('overwrites with --force and says so', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const { printed } = await runMain(['sync', '--yes', '--force']);

    expect(printed).toContain(`wrote ${RULE}`);
    expect(await readFile(join(project, RULE), 'utf8')).not.toBe('# local edit\n');
  });

  // Both hold the project's own edits, so `--force` is never offered them.
  it('never proposes a preserved file that it would only have kept', async () => {
    await generated();

    const setup = join(project, '__mocks__/setupTests.tsx');
    const own = '// the project own setup\n';
    const adapter = '# our own instructions\n';

    await writeFile(setup, own, 'utf8');
    await writeFile(join(project, 'CLAUDE.md'), adapter, 'utf8');

    const { printed } = await runMain(['sync', '--yes', '--force']);

    expect(printed).toContain('Everything is already up to date.');
    expect(printed).not.toContain('wrote ');
    expect(await readFile(setup, 'utf8')).toBe(own);
    expect(await readFile(join(project, 'CLAUDE.md'), 'utf8')).toBe(adapter);
  });

  it('restores a preserved file the project deleted', async () => {
    await generated();

    await rm(join(project, 'CLAUDE.md'));

    const { printed } = await runMain(['sync', '--yes', '--force']);

    expect(printed).toContain('wrote CLAUDE.md');
    expect(await readFile(join(project, 'CLAUDE.md'), 'utf8')).toContain('LintelJS project');
  });

  // Only the exact paths this CLI writes go.
  it('removes the files of a host the config stopped selecting, and nothing beside them', async () => {
    await generated();
    await writeFile(join(project, '.claude/notes.md'), '# ours\n', 'utf8');
    await writeConfig({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    });

    const { printed } = await runMain(['sync', '--force'], scripted([]));

    expect(printed).toContain('.claude/settings.json: obsolete');
    expect(printed).toContain('removed .claude/settings.json');
    expect(printed).toContain('removed plugins/linteljs/.claude-plugin/plugin.json');
    expect(printed).toContain('wrote AGENTS.md');

    expect(await exists(join(project, '.claude/settings.json'))).toBe(false);
    expect(await exists(join(project, 'plugins/linteljs/.claude-plugin'))).toBe(false);
    expect(await readFile(join(project, '.claude/notes.md'), 'utf8')).toBe('# ours\n');
    expect(await exists(join(project, 'CLAUDE.md'))).toBe(true);
  });

  it('lists an obsolete file without removing it when --force was not passed', async () => {
    await generated();
    await writeConfig({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    });

    const { printed } = await runMain(['sync'], scripted([]));

    expect(printed).toContain('.claude/settings.json: obsolete');
    expect(printed).toContain('Re-run with --force');
    expect(printed).not.toContain('removed ');
    expect(await exists(join(project, '.claude/settings.json'))).toBe(true);
  });

  it.each([
    ['is absent', null, 'lintel.config.json was not found; this is not a LintelJS-managed project'],
    ['is not JSON', '{', 'lintel.config.json is not valid JSON'],
    [
      'names a field this build does not accept',
      emitLintelConfig(DEFAULT_ANSWERS).replace('"typeSafety": "strict"', '"typeSafety": "loose"'),
      'typeSafety must be one of: strict, relaxed',
    ],
    [
      'was written by a newer release',
      emitLintelConfig(DEFAULT_ANSWERS).replace('"schemaVersion": 1', '"schemaVersion": 2'),
      'lintel.config.json schema version 2 is unsupported; update @linteljs/create',
    ],
  ])('refuses to sync a config that %s, and writes nothing', async (_case, config, message) => {
    const asked = scripted([]);

    await writeFile(join(project, 'package.json'), '{"name":"kept"}\n', 'utf8');

    if (config !== null) {
      await writeFile(join(project, CONFIG_PATH), config, 'utf8');
    }

    const {
      code,
      errors,
      printed,
    } = await runMain(['sync', '--force'], asked);

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain(message);
    expect(asked.calls).toEqual([]);
    expect(printed).toBe('');
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
    await expect(readOptional(join(project, CONFIG_PATH))).resolves.toBe(config);
  });

  it('plans from the root config rather than asking again', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'svelte',
    });

    const asked = scripted([]);
    const { printed } = await runMain(['sync'], asked);

    expect(asked.calls).toEqual([]);
    expect(printed).toContain('plugins/linteljs/skills/linteljs/references/svelte-reactivity.md: missing');
  });

  // Recorded by hand, so its only route is read back off disk and written into the emitted config.
  it('carries recorded resolver conditions into the emitted config', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      resolveConditions: ['import', 'require', 'node', 'default'],
    });

    await runMain(['sync', '--force'], scripted([]));

    const emitted = await readFile(join(project, 'eslint.config.js'), 'utf8');

    expect(emitted).toContain("resolver: { conditionNames: ['import', 'require', 'node', 'default'] },");
  });

  // Both extension axes survive the round trip, since `sync` and `--skip-scaffold` plan from the record.
  // `answersIn` once dropped a new answer silently and replanned a devtools-panel project as a popup one.
  // Both merges were once stage writes, so the 1.2.0 `peerDependencyRules` allowance reached no existing project.
  it('merges into the workspace file and the gitignore a project already has', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'next',
    });
    await writeFile(
      join(project, 'pnpm-workspace.yaml'),
      "allowBuilds:\n  'sharp': true\n",
      'utf8',
    );
    await writeFile(join(project, '.gitignore'), 'node_modules\n.next\n', 'utf8');

    await runMain(['sync', '--force'], scripted([]));

    const workspace = await readFile(join(project, 'pnpm-workspace.yaml'), 'utf8');
    const ignore = await readFile(join(project, '.gitignore'), 'utf8');

    expect(workspace).toContain('peerDependencyRules:');
    // Merged, so the project's own entry survives.
    expect(workspace).toContain("'sharp': true");
    expect(ignore).toContain('coverage');
    expect(ignore).toContain('.next');
  });

  it('emits an extension from the surfaces the config recorded', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      surfaces: ['devtools-panel'],
    });

    await runMain(['sync', '--force'], scripted([]));

    expect(await readFile(join(project, 'vite.config.ts'), 'utf8'))
      .toContain("input: { panel: 'panel.html' }");
    // This project has no background entry.
    expect(await readFile(join(project, 'vitest.config.ts'), 'utf8'))
      .not.toContain('src/background/index.ts');
    expect((await configAt()).surfaces).toEqual(['devtools-panel']);
  });

  // An alias that survives the parse but not the whitelist is lost on the first sync.
  it("keeps a project's own aliases through a sync, in every consumer", async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      aliases: { '@engine': './src/lib/engine/index.ts' },
      browsers: ['chrome', 'firefox'],
      ignores: ['src/lib/compat-data/generatedRegistry.ts'],
    });

    await runMain(['sync', '--force'], scripted([]));

    const eslintConfig = await readFile(join(project, 'eslint.config.js'), 'utf8');

    expect(eslintConfig).toContain("'@engine': './src/lib/engine/index.ts',");
    // After the shared list: a project adds to the standard.
    expect(eslintConfig).toContain("'src/lib/compat-data/generatedRegistry.ts',");
    expect(eslintConfig).toContain("'coverage/**'");
    expect(await readFile(join(project, 'tsconfig.json'), 'utf8'))
      .toContain('"@engine": [');

    const config = await configAt();

    expect(config.aliases).toEqual({ '@engine': './src/lib/engine/index.ts' });
    expect(config.browsers).toEqual(['chrome', 'firefox']);
  });

  // The general form of the two above, through the route that writes the config back.
  it('plans from every answer a recorded config carries, not a subset of them', async () => {
    const recorded: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
      surfaces: ['devtools-panel'],
      testing: 'none',
      packageManager: 'npm',
      libraries: ['zod', 'tailwind'],
      store: false,
      typeSafety: 'relaxed',
      agents: ['codex'],
      plugins: ['context7'],
      resolveConditions: ['import', 'default'],
      aliases: { '@engine': './src/lib/engine/index.ts' },
      browsers: ['firefox', 'chrome'],
      ignores: ['src/lib/compat-data/generatedRegistry.ts'],
    };

    await writeConfig(recorded);
    await runMain(['--skip-scaffold', '--no-install'], scripted([]));

    expect(await configAt()).toMatchObject(recorded);
  });

  // Two of three migrations had to add plugins by hand that their recorded answers already implied.
  it('adds the dependencies the answers imply and keeps what the project declared', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'solid',
    });
    await writeFile(
      join(project, 'package.json'),
      `${JSON.stringify({
        name: 'demo',
        devDependencies: { 'some-tool': '^1.0.0' },
      }, null, 2)}\n`,
      'utf8',
    );

    await runMain(['sync', '--force'], scripted([]));

    const packageJson = parsePackageJson(await readFile(join(project, 'package.json'), 'utf8'));

    expect(packageJson.devDependencies).toHaveProperty('eslint-plugin-solid');
    expect(packageJson.devDependencies).toHaveProperty('@linteljs/eslint-config');
    // A merge, not an overwrite.
    expect(packageJson.devDependencies?.['some-tool']).toBe('^1.0.0');
    expect(packageJson.name).toBe('demo');
  });

  it('plans an extension from the browser and framework the config recorded', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
    });

    const asked = scripted([]);
    const { printed } = await runMain(['sync'], asked);

    expect(asked.calls).toEqual([]);
    expect(printed).toContain('plugins/linteljs/skills/linteljs/references/solid-reactivity.md: missing');
  });

  it('leaves current config bytes unchanged when forced sync writes an artifact', async () => {
    await generated();

    const parsed = await configAt();
    const custom = `${JSON.stringify(parsed, null, 4)}\n`;

    await writeFile(join(project, CONFIG_PATH), custom, 'utf8');
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const { code } = await runMain(['sync', '--force'], scripted([]));

    expect(code).toBe(0);
    expect(await readFile(join(project, CONFIG_PATH), 'utf8')).toBe(custom);
  });
});

// A stage that threw is surfaced as one line rather than an unhandled rejection over a half-written directory.
describe('main: an unexpected failure', () => {
  it('reports the message and exits 1 rather than throwing', async () => {
    await writeFile(join(project, 'package.json'), '{ not json', 'utf8');

    const { code, errors } = await runMain(['--skip-scaffold', '--no-install', '--yes']);

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain('JSON');
  });
});

describe('main: the package manager', () => {
  it('is checked for before the pipeline runs', async () => {
    const commands = await import('../utils/commandUtils');
    const spy = vi.spyOn(commands, 'ensurePackageManager').mockImplementation(() => {
      throw new Error('bun is not installed.');
    });

    await writeConfig({
      ...DEFAULT_ANSWERS,
      packageManager: 'bun',
    });

    const { code, errors } = await runMain(['--skip-scaffold', '--no-install']);

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain('bun is not installed.');
    expect(spy).toHaveBeenCalledWith('bun', expect.any(Function));

    spy.mockRestore();
  });
});

describe('main: answers given as flags', () => {
  it('takes every flag, asks nothing, and records the answers', async () => {
    const asked = scripted([]);
    const { code } = await runMain([
      '--skip-scaffold', '--no-install', '--target', 'svelte', '--pm', 'bun', '--libraries', 'zod,es-toolkit',
      '--libraries', 'tailwind', '--testing', 'none', '--type-safety', 'relaxed', '--agents', 'codex',
    ], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(await configAt()).toMatchObject({
      target: 'svelte',
      packageManager: 'bun',
      libraries: ['zod', 'es-toolkit', 'tailwind'],
      testing: 'none',
      typeSafety: 'relaxed',
      agents: ['codex'],
      plugins: [...DEFAULT_ANSWERS.plugins],
    });
  });

  it('records a router and a store', async () => {
    await runMain(['--skip-scaffold', '--no-install', '--router', 'tanstack-router', '--store']);

    expect(await configAt()).toMatchObject({
      router: 'tanstack-router',
      store: true,
    });
  });

  it.each([
    [['--target', 'wat'], 'target must be one of: react, next'],
    [['--libraries', 'tanstack-form', '--libraries', 'react-hook-form'], 'libraries must contain at most one of'],
    [['--router', 'wouter'], 'router must be one of: react-router, tanstack-router'],
    [['--target', 'vue', '--router', 'react-router'], 'router is not an answer for vue'],
    [['--target', 'svelte', '--store'], 'store is not an answer for svelte'],
  ])('refuses %j with the message a bad config gets, before writing anything', async (flags, message) => {
    const { code, errors } = await runMain(['--skip-scaffold', '--no-install', ...flags]);

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain(message);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });
});

describe('main: what a run reports', () => {
  it('prints the version and nothing else', async () => {
    const { code, printed } = await runMain(['--version']);

    expect(code).toBe(0);
    expect(printed.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('numbers each stage as it starts and closes with the next command', async () => {
    const { printed } = await runMain(['--skip-scaffold', '--no-install', '--yes', '--pm', 'npm']);

    expect(printed).toContain('[2/6] lint: eslint and stylelint config');
    expect(printed).toContain('[4/6] standard:');
    expect(printed).not.toContain('[1/6] scaffold');
    expect(printed).toContain('Done. Next:\n  npm install\n  npm run lint:fix\n  npm run check');
    expect(printed).not.toContain('  cd ');
  });
});
