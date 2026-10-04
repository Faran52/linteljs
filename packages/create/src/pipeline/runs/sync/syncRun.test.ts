import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import { omit } from 'es-toolkit';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGED_PATH } from '@config/constants';

import { CONFIG_PATH, LEGACY_CONFIG_PATH } from '@answers';
import { exists } from '@disk';
import { parsePackageJson } from '@emitters';

import {
  applySync,
  planSync,
  type SyncEntry,
  type SyncResult,
} from './syncRun';

import type { HostedAnswers } from '@config/types';

const HUSKY_HOOK = '.husky/pre-commit';
const TYPE_STANDARDS = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

const CLAUDE_ONLY = [
  '.claude/settings.json',
  'plugins/linteljs/.claude-plugin/marketplace.json',
  'plugins/linteljs/.claude-plugin/plugin.json',
];

const CODEX_ONLY: HostedAnswers = {
  ...HOSTED_DEFAULTS,
  agents: ['codex'],
};

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-sync-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const applyPending = async (answers: HostedAnswers): Promise<SyncResult> => {
  const { pending } = await planSync(cwd, answers);

  const targets = pending
    .map((entry) => {
      return entry.target;
    });

  return await applySync(cwd, answers, targets);
};

const entryOf = async (answers: HostedAnswers, target: string): Promise<SyncEntry | undefined> => {
  const { entries } = await planSync(cwd, answers);

  return entries
    .find((entry) => {
      return entry.target === target;
    });
};

const statusOf = async (answers: HostedAnswers, target: string): Promise<string | undefined> => {
  const entry = await entryOf(answers, target);

  return entry?.status;
};

describe('planSync', () => {
  it('marks every artifact missing against an empty directory, and pending all of them', async () => {
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    expect(plan.entries.length).toBeGreaterThan(0);

    const allMissing = plan.entries
      .every((entry) => {
        return entry.status === 'missing';
      });

    expect(allMissing).toBe(true);
    expect(plan.pending).toEqual(plan.entries);
  });

  it('finds no dependency drift without a package.json', async () => {
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    const expected = {
      dependencies: {},
      devDependencies: {},
    };
    expect(plan.upgrades).toEqual([]);
    expect(plan.missing).toEqual(expected);
  });

  it('never plans the recorded config or its own record', async () => {
    const { entries } = await planSync(cwd, HOSTED_DEFAULTS);
    const targets = entries
      .map(({ target }) => {
        return target;
      });

    expect(targets).not.toContain(CONFIG_PATH);
    expect(targets).not.toContain(MANAGED_PATH);
  });

  it('marks a written artifact unchanged and leaves it out of pending', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);

    const plan = await planSync(cwd, HOSTED_DEFAULTS);
    const entry = plan.entries
      .find((candidate) => {
        return candidate.target === 'eslint.config.js';
      });

    expect(entry?.status).toBe('unchanged');

    const pendsConfig = plan.pending
      .some((candidate) => {
        return candidate.target === 'eslint.config.js';
      });

    expect(pendsConfig).toBe(false);
  });

  it('reports a locally edited rule alone, and leaves the edit on disk', async () => {
    await applyPending(HOSTED_DEFAULTS);
    await writeFile(join(cwd, TYPE_STANDARDS), '# local edit\n', 'utf8');

    const { pending } = await planSync(cwd, HOSTED_DEFAULTS);

    const statuses = pending
      .map(({ target, status }) => {
        const pair = [target, status];
        return pair;
      });

    const expected = [[TYPE_STANDARDS, 'changed']];
    expect(statuses).toEqual(expected);
    const file = await readFile(join(cwd, TYPE_STANDARDS), 'utf8');
    expect(file).toBe('# local edit\n');
  });

  it('marks a locally edited artifact changed and pending', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);
    await writeFile(join(cwd, 'eslint.config.js'), '// edited locally\n', 'utf8');

    const plan = await planSync(cwd, HOSTED_DEFAULTS);
    const entry = plan.entries
      .find((candidate) => {
        return candidate.target === 'eslint.config.js';
      });

    expect(entry?.status).toBe('changed');
    expect(plan.pending).toContainEqual(entry);
  });

  it('calls an edited preserved artifact unchanged and its absence missing', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['CLAUDE.md']);
    await writeFile(join(cwd, 'CLAUDE.md'), '# our own instructions\n', 'utf8');

    const entry = await entryOf(HOSTED_DEFAULTS, 'CLAUDE.md');
    const expected = {
      target: 'CLAUDE.md',
      status: 'unchanged',
    };
    expect(entry).toEqual(expected);

    await rm(join(cwd, 'CLAUDE.md'));

    const hostedDefaultsStatus = await statusOf(HOSTED_DEFAULTS, 'CLAUDE.md');
    expect(hostedDefaultsStatus).toBe('missing');
  });

  it('rejects rather than reporting missing when a target cannot be read for a reason other than absence', async () => {
    await mkdir(join(cwd, 'eslint.config.js'));

    const promise = planSync(cwd, HOSTED_DEFAULTS);
    await expect(promise).rejects.toThrow();
  });

  it('marks a generated agent file obsolete once the answers stop selecting its host', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, CLAUDE_ONLY);

    const { entries, pending } = await planSync(cwd, CODEX_ONLY);
    const obsolete = entries
      .filter((entry) => {
        return entry.status === 'obsolete';
      });

    const obsoleteTargets = obsolete
      .map((entry) => {
        return entry.target;
      });

    expect(obsoleteTargets).toEqual(CLAUDE_ONLY);
    expect(pending).toEqual(expect.arrayContaining(obsolete));
  });

  it('leaves the deselected adapter and unknown files below a generated directory alone', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['CLAUDE.md', '.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    const { entries } = await planSync(cwd, CODEX_ONLY);
    const obsolete = entries
      .filter((entry) => {
        return entry.status === 'obsolete';
      })
      .map((entry) => {
        return entry.target;
      });

    const expected = ['.claude/settings.json'];
    expect(obsolete).toEqual(expected);
    expect(obsolete).not.toContain('CLAUDE.md');
  });

  it('reports nothing obsolete for a path the project never had', async () => {
    const plan = await planSync(cwd, CODEX_ONLY);

    const anyObsolete = plan.entries
      .some((entry) => {
        return entry.status === 'obsolete';
      });

    expect(anyObsolete).toBe(false);
  });
});

describe('applySync', () => {
  it('writes only the targets it is given', async () => {
    const { written, removed } = await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);

    const expected = ['eslint.config.js'];
    expect(written).toEqual(expected);
    expect(removed).toEqual([]);
    const eslintConfigJsExists = await exists(join(cwd, 'eslint.config.js'));
    expect(eslintConfigJsExists).toBe(true);
    const stylelintConfigJsExists = await exists(join(cwd, 'stylelint.config.js'));
    expect(stylelintConfigJsExists).toBe(false);
  });

  it('writes the file content that planSync would call unchanged afterwards', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);

    const written = await readFile(join(cwd, 'eslint.config.js'), 'utf8');

    expect(written).toContain('composeConfig');
  });

  it('restores an edited and a deleted config, after which nothing is pending', async () => {
    await applyPending(HOSTED_DEFAULTS);
    await writeFile(join(cwd, 'eslint.config.js'), '// hand edited\n', 'utf8');
    await rm(join(cwd, 'tsconfig.json'));

    const { pending } = await planSync(cwd, HOSTED_DEFAULTS);

    const statuses = pending
      .map(({ target, status }) => {
        const pair = [target, status];
        return pair;
      });

    const expected = [['eslint.config.js', 'changed'], ['tsconfig.json', 'missing']];
    expect(statuses).toEqual(expected);

    const { written } = await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js', 'tsconfig.json']);

    const expectedWritten = ['eslint.config.js', 'tsconfig.json'];
    expect(written).toEqual(expectedWritten);
    const { pending: stillPending } = await planSync(cwd, HOSTED_DEFAULTS);
    expect(stillPending).toEqual([]);
  });

  it('refuses to write a generated artifact through a symbolic link', async () => {
    const external = join(cwd, 'external-eslint.config.js');

    await writeFile(external, '// external config\n', 'utf8');
    await symlink(external, join(cwd, 'eslint.config.js'));

    const syncResultPromise = applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);

    await expect(syncResultPromise)
      .rejects.toThrow('Refusing to write eslint.config.js: target is a symbolic link');

    const file = await readFile(external, 'utf8');
    expect(file).toBe('// external config\n');
  });

  it('refuses to remove an obsolete file through a symbolic-link parent', async () => {
    const external = join(cwd, 'external-claude');

    await mkdir(join(cwd, 'plugins', 'linteljs'), { recursive: true });

    await writeFile(
      join(cwd, MANAGED_PATH),
      `${JSON.stringify({ removable: ['.claude/settings.json'] })}\n`,
      'utf8',
    );

    await mkdir(external);
    await writeFile(join(external, 'settings.json'), '{"external":true}\n', 'utf8');
    await symlink(external, join(cwd, '.claude'));

    const syncResultPromise = applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    await expect(syncResultPromise)
      .rejects.toThrow('Refusing to use .claude/settings.json: a parent directory is a symbolic link');

    const file = await readFile(join(external, 'settings.json'), 'utf8');
    expect(file).toBe('{"external":true}\n');
  });

  it('makes an executable artifact executable on disk', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, [HUSKY_HOOK]);

    const { mode } = await stat(join(cwd, HUSKY_HOOK));

    expect(mode & 0o111).toBe(0o111);
  });

  it('writes a preserved file when missing, and leaves it alone once it exists', async () => {
    const setup = '__mocks__/setupTests.tsx';
    const first = await applySync(cwd, HOSTED_DEFAULTS, [setup]);

    const expected = [setup];
    expect(first.written).toEqual(expected);

    await writeFile(join(cwd, setup), '// the project own setup\n', 'utf8');

    const second = await applySync(cwd, HOSTED_DEFAULTS, [setup]);

    expect(second.written).toEqual([]);
    const file = await readFile(join(cwd, setup), 'utf8');
    expect(file).toBe('// the project own setup\n');
  });

  it('writes a 1.x project\'s answers under the current name and then removes the old one', async () => {
    await writeFile(join(cwd, LEGACY_CONFIG_PATH), '{}\n', 'utf8');

    const { written, removed } = await applyPending(HOSTED_DEFAULTS);

    expect(written).toContain(CONFIG_PATH);
    expect(removed).toContain(LEGACY_CONFIG_PATH);

    const configText = await readFile(join(cwd, CONFIG_PATH), 'utf8');
    const config: unknown = JSON.parse(configText);

    expect(config).toMatchObject(omit(HOSTED_DEFAULTS, ['browser']));
  });

  it('keeps a 1.x config it is told to remove while the current name is unwritten', async () => {
    const legacyPath = join(cwd, LEGACY_CONFIG_PATH);

    await writeFile(legacyPath, '{}\n', 'utf8');

    const { removed } = await applySync(cwd, HOSTED_DEFAULTS, [LEGACY_CONFIG_PATH]);

    expect(removed).toEqual([]);
    const legacyExists = await exists(legacyPath);
    expect(legacyExists).toBe(true);
  });

  it('removes the obsolete files it is given and reports each one', async () => {
    await applyPending(HOSTED_DEFAULTS);

    const { removed } = await applyPending(CODEX_ONLY);

    expect(removed).toEqual(CLAUDE_ONLY);

    for (const target of CLAUDE_ONLY) {
      const targetExists = await exists(join(cwd, target));
      expect(targetExists).toBe(false);
    }

    const agentsMdExists = await exists(join(cwd, 'AGENTS.md'));
    expect(agentsMdExists).toBe(true);
    const actual = await exists(join(cwd, '.agents/plugins/marketplace.json'));
    expect(actual).toBe(true);
    const claudeMdExists = await exists(join(cwd, 'CLAUDE.md'));
    expect(claudeMdExists).toBe(true);
  });

  it('keeps the Cursor and Copilot hooks files current and removes them once their agents are dropped', async () => {
    const hosted: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      agents: ['cursor', 'copilot'],
    };
    const own = '{"version":1,"hooks":{"afterFileEdit":[{"command":".cursor/hooks/format.sh"}]}}\n';

    await applyPending(hosted);

    const managedText = await readFile(join(cwd, MANAGED_PATH), 'utf8');
    const managed: unknown = JSON.parse(managedText);

    const hooksFiles = ['.cursor/hooks.json', '.github/hooks/linteljs.json'];

    expect(managed).toHaveProperty('removable', expect.arrayContaining(hooksFiles));

    await writeFile(join(cwd, '.cursor/hooks.json'), own, 'utf8');
    await applyPending(hosted);

    const file = await readFile(join(cwd, '.cursor/hooks.json'), 'utf8');
    expect(file).toContain('.cursor/hooks/format.sh');
    const cursorHooksJsonFile = await readFile(join(cwd, '.cursor/hooks.json'), 'utf8');
    expect(cursorHooksJsonFile).toContain('gitSafetyGuardHook.ts');

    const { removed } = await applyPending(CODEX_ONLY);

    expect(removed).toEqual(expect.arrayContaining(hooksFiles));
    const cursorHooksJsonExists = await exists(join(cwd, '.cursor/hooks.json'));
    expect(cursorHooksJsonExists).toBe(false);
    const actual = await exists(join(cwd, '.github/hooks/linteljs.json'));
    expect(actual).toBe(false);
  });

  it('removes the retired shell hooks and parser a previous run recorded, and keeps what replaced them', async () => {
    const retired = [
      'plugins/linteljs/hooks/banned-pattern-guard.sh',
      'plugins/linteljs/hooks/commandParser.ts',
      'plugins/linteljs/hooks/eslint-fix-warning.sh',
      'plugins/linteljs/hooks/git-safety-guard.sh',
    ];

    await applyPending(HOSTED_DEFAULTS);

    await writeFile(
      join(cwd, MANAGED_PATH),
      `${JSON.stringify({ removable: retired })}\n`,
      'utf8',
    );

    for (const target of retired) {
      await writeFile(join(cwd, target), '#!/usr/bin/env bash\n', 'utf8');
    }

    const { entries } = await planSync(cwd, HOSTED_DEFAULTS);

    const obsoleteTargets = entries
      .filter(({ status }) => {
        return status === 'obsolete';
      })
      .map(({ target }) => {
        return target;
      });

    expect(obsoleteTargets).toEqual(retired);

    const { removed } = await applyPending(HOSTED_DEFAULTS);

    expect(removed).toEqual(retired);

    for (const target of retired) {
      const targetExists = await exists(join(cwd, target));
      expect(targetExists).toBe(false);
    }

    const hooksJsonExists = await exists(join(cwd, 'plugins/linteljs/hooks/hooks.json'));
    expect(hooksJsonExists).toBe(true);
    const gitGuardExists = await exists(join(cwd, 'plugins/linteljs/hooks/gitSafetyGuardHook.ts'));
    expect(gitGuardExists).toBe(true);
    const parserUtilsExists = await exists(join(cwd, 'plugins/linteljs/hooks/utils/commandParserUtils.ts'));
    expect(parserUtilsExists).toBe(true);
    const hostUtilsExists = await exists(join(cwd, 'plugins/linteljs/hooks/utils/hostUtils.ts'));
    expect(hostUtilsExists).toBe(true);
  });

  it('names a package.json it writes from nothing after the directory', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['package.json']);

    const manifestText = await readFile(join(cwd, 'package.json'), 'utf8');
    const manifest: unknown = JSON.parse(manifestText);

    expect(manifest).toHaveProperty('name', basename(cwd));
  });

  it('skips and does not report an obsolete file that vanished with its directory after it was planned', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, CLAUDE_ONLY);
    await rm(join(cwd, '.claude'), { recursive: true });

    const { removed } = await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    expect(removed).toEqual([]);
  });

  it('removes nothing it was not given, even where the plan called it obsolete', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, CLAUDE_ONLY);

    const { removed } = await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    const expected = ['.claude/settings.json'];
    expect(removed).toEqual(expected);
    const actual = await exists(join(cwd, 'plugins/linteljs/.claude-plugin/plugin.json'));
    expect(actual).toBe(true);
  });

  it('drops the directories that empty out and keeps the ones that do not', async () => {
    await applyPending(HOSTED_DEFAULTS);
    await applyPending(CODEX_ONLY);

    const claudeExists = await exists(join(cwd, '.claude'));
    expect(claudeExists).toBe(false);
    const actual = await exists(join(cwd, 'plugins/linteljs/.claude-plugin'));
    expect(actual).toBe(false);
    const pluginsLinteljsExists = await exists(join(cwd, 'plugins/linteljs'));
    expect(pluginsLinteljsExists).toBe(true);
    const pluginsExists = await exists(join(cwd, 'plugins'));
    expect(pluginsExists).toBe(true);
  });

  it('drops a directory whose emptying waits on a deeper one met after it', async () => {
    const retired = ['retired/a.md', 'retired/deep/er/b.md'];

    await applyPending(HOSTED_DEFAULTS);
    await writeFile(join(cwd, MANAGED_PATH), `${JSON.stringify({ removable: retired })}\n`, 'utf8');
    await mkdir(join(cwd, 'retired/deep/er'), { recursive: true });

    for (const target of retired) {
      await writeFile(join(cwd, target), '# retired\n', 'utf8');
    }

    const { removed } = await applyPending(HOSTED_DEFAULTS);
    expect(removed).toEqual(retired);
    const retiredExists = await exists(join(cwd, 'retired'));
    expect(retiredExists).toBe(false);
  });

  it('keeps a directory a project put its own file in', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    const claudeSettingsJsonExists = await exists(join(cwd, '.claude/settings.json'));
    expect(claudeSettingsJsonExists).toBe(false);
    const file = await readFile(join(cwd, '.claude/notes.md'), 'utf8');
    expect(file).toBe('# ours\n');
  });
});

describe('sync limits itself to what linteljs owns', () => {
  const CI = '.github/workflows/ci.yml';

  const plantPackageJson = async (devDependencies: Record<string, string>): Promise<void> => {
    const manifest = {
      name: 'kept',
      scripts: { check: 'our own gate' },
      dependencies: { react: '^99.0.0' },
      devDependencies,
    };

    await writeFile(join(cwd, 'package.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
  };

  const syncedPackageJson = async (): Promise<ReturnType<typeof parsePackageJson>> => {
    await applyPending(HOSTED_DEFAULTS);

    const text = await readFile(join(cwd, 'package.json'), 'utf8');

    return parsePackageJson(text);
  };

  it('keeps a bumped framework, its scripts and every other version, and upgrades an old @linteljs/* one', async () => {
    await plantPackageJson({
      '@linteljs/eslint-config': '^1.5.0',
      'typescript': '^99.0.0',
    });

    const { upgrades } = await planSync(cwd, HOSTED_DEFAULTS);
    const synced = await syncedPackageJson();

    const expected = [{
      name: '@linteljs/eslint-config',
      from: '^1.5.0',
      to: '^2.0.0',
    }];
    expect(upgrades).toEqual(expected);

    const expectedDependencies = { react: '^99.0.0' };
    expect(synced.dependencies).toEqual(expectedDependencies);

    const expectedDevDependencies = {
      '@linteljs/eslint-config': '^2.0.0',
      'typescript': '^99.0.0',
    };
    expect(synced.devDependencies).toEqual(expectedDevDependencies);

    const expectedScripts = { check: 'our own gate' };
    expect(synced.scripts).toEqual(expectedScripts);
  });

  it('reports a dependency linteljs needs and the project lacks, and never writes it', async () => {
    await plantPackageJson({ '@linteljs/eslint-config': '^2.0.0' });

    const { missing, upgrades } = await planSync(cwd, HOSTED_DEFAULTS);
    const synced = await syncedPackageJson();

    expect(upgrades).toEqual([]);
    expect(missing.devDependencies).toHaveProperty('husky');
    const expected = { '@linteljs/eslint-config': '^2.0.0' };
    expect(synced.devDependencies).toEqual(expected);
  });

  it('plans package.json unchanged, byte for byte, when no @linteljs/* version is behind', async () => {
    await plantPackageJson({ '@linteljs/eslint-config': '^2.1.0' });

    const status = await statusOf(HOSTED_DEFAULTS, 'package.json');
    expect(status).toBe('unchanged');
  });

  it('never moves a @linteljs/* range that is not a version', async () => {
    await plantPackageJson({ '@linteljs/eslint-config': 'workspace:*' });

    const { upgrades } = await planSync(cwd, HOSTED_DEFAULTS);

    expect(upgrades).toEqual([]);
  });

  it('upgrades a @linteljs/* package where the project keeps it, even under dependencies', async () => {
    const manifest = { dependencies: { '@linteljs/eslint-config': '^1.0.0' } };

    await writeFile(join(cwd, 'package.json'), `${JSON.stringify(manifest)}\n`, 'utf8');

    const synced = await syncedPackageJson();

    const expected = { '@linteljs/eslint-config': '^2.0.0' };
    expect(synced.dependencies).toEqual(expected);
    expect(synced.devDependencies).toEqual({});
  });

  it('leaves a ci.yml the project has untouched, and writes one that is missing', async () => {
    await mkdir(join(cwd, '.github/workflows'), { recursive: true });
    await writeFile(join(cwd, CI), 'name: ours\n', 'utf8');

    const status = await statusOf(HOSTED_DEFAULTS, CI);

    await applyPending(HOSTED_DEFAULTS);

    expect(status).toBe('unchanged');
    const file = await readFile(join(cwd, CI), 'utf8');
    expect(file).toBe('name: ours\n');

    await rm(join(cwd, CI));

    const hostedDefaultsStatus = await statusOf(HOSTED_DEFAULTS, CI);
    expect(hostedDefaultsStatus).toBe('missing');
  });

  it('keeps the build opt-outs a project wrote into pnpm-workspace.yaml', async () => {
    const workspace = 'ignoredBuiltDependencies:\n  - esbuild\n';

    await writeFile(join(cwd, 'pnpm-workspace.yaml'), workspace, 'utf8');
    await applyPending(HOSTED_DEFAULTS);

    const file = await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8');
    expect(file).toContain(workspace);
  });
});
