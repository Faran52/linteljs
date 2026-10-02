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
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { MANAGED_PATH } from '@config/constants';

import { CONFIG_PATH } from '@answers';
import { exists } from '@disk';

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
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-sync-'));
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
  return (await entryOf(answers, target))?.status;
};

describe('planSync', () => {
  it('marks every artifact missing against an empty directory, and pending all of them', async () => {
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    expect(plan.entries.length).toBeGreaterThan(0);

    const allMissing = plan.entries
      .every((entry) => {
        return entry.status === 'missing' && entry.diff === '';
      });

    expect(allMissing).toBe(true);
    expect(plan.pending).toEqual(plan.entries);
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
    expect(entry?.diff).toBe('');

    const pendsConfig = plan.pending
      .some((candidate) => {
        return candidate.target === 'eslint.config.js';
      });

    expect(pendsConfig).toBe(false);
  });

  it('reports a locally edited rule alone, with its diff, and leaves the edit on disk', async () => {
    await applyPending(HOSTED_DEFAULTS);
    await writeFile(join(cwd, TYPE_STANDARDS), '# local edit\n', 'utf8');

    const { pending } = await planSync(cwd, HOSTED_DEFAULTS);

    const statuses = pending
      .map(({ target, status }) => {
        return [target, status];
      });

    expect(statuses).toEqual([[TYPE_STANDARDS, 'changed']]);
    expect(pending[0]?.diff).toContain('local edit');
    expect(await readFile(join(cwd, TYPE_STANDARDS), 'utf8')).toBe('# local edit\n');
  });

  it('reports a changed file without a diff when git cannot be spawned', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, [TYPE_STANDARDS]);
    await writeFile(join(cwd, TYPE_STANDARDS), '# local edit\n', 'utf8');
    vi.stubEnv('PATH', '');

    try {
      const entry = (await planSync(cwd, HOSTED_DEFAULTS)).entries
        .find(({ target }) => {
          return target === TYPE_STANDARDS;
        });

      expect(entry?.status).toBe('changed');
      expect(entry?.diff).toBe('');
    }
    finally {
      vi.unstubAllEnvs();
    }
  });

  it('reports a changed file without a diff when the diff outgrows what git can hand back', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, [TYPE_STANDARDS]);
    await writeFile(join(cwd, TYPE_STANDARDS), 'local edit\n'.repeat(200_000), 'utf8');

    const entry = (await planSync(cwd, HOSTED_DEFAULTS)).entries
      .find(({ target }) => {
        return target === TYPE_STANDARDS;
      });

    expect(entry?.status).toBe('changed');
    expect(entry?.diff).toBe('');
  });

  it('marks a locally edited artifact changed and carries a diff of the edit', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']);
    await writeFile(join(cwd, 'eslint.config.js'), '// edited locally\n', 'utf8');

    const plan = await planSync(cwd, HOSTED_DEFAULTS);
    const entry = plan.entries
      .find((candidate) => {
        return candidate.target === 'eslint.config.js';
      });

    expect(entry?.status).toBe('changed');
    expect(entry?.diff).toContain('edited locally');
    expect(plan.pending).toContainEqual(entry);
  });

  it('calls an edited preserved artifact unchanged and its absence missing', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['CLAUDE.md']);
    await writeFile(join(cwd, 'CLAUDE.md'), '# our own instructions\n', 'utf8');

    expect(await entryOf(HOSTED_DEFAULTS, 'CLAUDE.md')).toEqual({
      target: 'CLAUDE.md',
      status: 'unchanged',
      diff: '',
    });

    await rm(join(cwd, 'CLAUDE.md'));

    expect(await statusOf(HOSTED_DEFAULTS, 'CLAUDE.md')).toBe('missing');
  });

  it('rejects rather than reporting missing when a target cannot be read for a reason other than absence', async () => {
    await mkdir(join(cwd, 'eslint.config.js'));

    await expect(planSync(cwd, HOSTED_DEFAULTS)).rejects.toThrow();
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

    const allEmpty = obsolete
      .every((entry) => {
        return entry.diff === '';
      });

    expect(allEmpty).toBe(true);
    expect(pending).toEqual(expect.arrayContaining(obsolete));
  });

  it('leaves the deselected adapter and unknown files below a generated directory alone', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['CLAUDE.md', '.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    const obsolete = (await planSync(cwd, CODEX_ONLY)).entries
      .filter((entry) => {
        return entry.status === 'obsolete';
      })
      .map((entry) => {
        return entry.target;
      });

    expect(obsolete).toEqual(['.claude/settings.json']);
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

    expect(written).toEqual(['eslint.config.js']);
    expect(removed).toEqual([]);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
    expect(await exists(join(cwd, 'stylelint.config.js'))).toBe(false);
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
        return [target, status];
      });

    expect(statuses).toEqual([['eslint.config.js', 'changed'], ['tsconfig.json', 'missing']]);

    const { written } = await applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js', 'tsconfig.json']);

    expect(written).toEqual(['eslint.config.js', 'tsconfig.json']);
    expect((await planSync(cwd, HOSTED_DEFAULTS)).pending).toEqual([]);
  });

  it('refuses to write a generated artifact through a symbolic link', async () => {
    const external = join(cwd, 'external-eslint.config.js');

    await writeFile(external, '// external config\n', 'utf8');
    await symlink(external, join(cwd, 'eslint.config.js'));

    await expect(applySync(cwd, HOSTED_DEFAULTS, ['eslint.config.js']))
      .rejects.toThrow('Refusing to write eslint.config.js: target is a symbolic link');

    await expect(readFile(external, 'utf8')).resolves.toBe('// external config\n');
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

    await expect(applySync(cwd, CODEX_ONLY, ['.claude/settings.json']))
      .rejects.toThrow('Refusing to use .claude/settings.json: a parent directory is a symbolic link');

    await expect(readFile(join(external, 'settings.json'), 'utf8')).resolves.toBe('{"external":true}\n');
  });

  it('makes an executable artifact executable on disk', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, [HUSKY_HOOK]);

    const { mode } = await stat(join(cwd, HUSKY_HOOK));

    expect(mode & 0o111).toBe(0o111);
  });

  it('writes a preserved file when missing, and leaves it alone once it exists', async () => {
    const setup = '__mocks__/setupTests.tsx';
    const first = await applySync(cwd, HOSTED_DEFAULTS, [setup]);

    expect(first.written).toEqual([setup]);

    await writeFile(join(cwd, setup), '// the project own setup\n', 'utf8');

    const second = await applySync(cwd, HOSTED_DEFAULTS, [setup]);

    expect(second.written).toEqual([]);
    expect(await readFile(join(cwd, setup), 'utf8')).toBe('// the project own setup\n');
  });

  it('removes the obsolete files it is given and reports each one', async () => {
    await applyPending(HOSTED_DEFAULTS);

    const { removed } = await applyPending(CODEX_ONLY);

    expect(removed).toEqual(CLAUDE_ONLY);

    for (const target of CLAUDE_ONLY) {
      expect(await exists(join(cwd, target))).toBe(false);
    }

    expect(await exists(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(await exists(join(cwd, '.agents/plugins/marketplace.json'))).toBe(true);
    expect(await exists(join(cwd, 'CLAUDE.md'))).toBe(true);
  });

  it('keeps the Cursor and Copilot hooks files current and removes them once their agents are dropped', async () => {
    const hosted: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      agents: ['cursor', 'copilot'],
    };
    const own = '{"version":1,"hooks":{"afterFileEdit":[{"command":".cursor/hooks/format.sh"}]}}\n';

    await applyPending(hosted);

    const managed: unknown = JSON.parse(await readFile(join(cwd, MANAGED_PATH), 'utf8'));

    const hooksFiles = ['.cursor/hooks.json', '.github/hooks/linteljs.json'];

    expect(managed).toHaveProperty('removable', expect.arrayContaining(hooksFiles));

    await writeFile(join(cwd, '.cursor/hooks.json'), own, 'utf8');
    await applyPending(hosted);

    expect(await readFile(join(cwd, '.cursor/hooks.json'), 'utf8')).toContain('.cursor/hooks/format.sh');
    expect(await readFile(join(cwd, '.cursor/hooks.json'), 'utf8')).toContain('gitSafetyGuardHook.ts');

    const { removed } = await applyPending(CODEX_ONLY);

    expect(removed).toEqual(expect.arrayContaining(hooksFiles));
    expect(await exists(join(cwd, '.cursor/hooks.json'))).toBe(false);
    expect(await exists(join(cwd, '.github/hooks/linteljs.json'))).toBe(false);
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
      expect(await exists(join(cwd, target))).toBe(false);
    }

    expect(await exists(join(cwd, 'plugins/linteljs/hooks/hooks.json'))).toBe(true);
    expect(await exists(join(cwd, 'plugins/linteljs/hooks/gitSafetyGuardHook.ts'))).toBe(true);
    expect(await exists(join(cwd, 'plugins/linteljs/hooks/utils/commandParserUtils.ts'))).toBe(true);
    expect(await exists(join(cwd, 'plugins/linteljs/hooks/utils/hostUtils.ts'))).toBe(true);
  });

  it('names a package.json it writes from nothing after the directory', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['package.json']);

    expect(JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))).toHaveProperty('name', basename(cwd));
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

    expect(removed).toEqual(['.claude/settings.json']);
    expect(await exists(join(cwd, 'plugins/linteljs/.claude-plugin/plugin.json'))).toBe(true);
  });

  it('drops the directories that empty out and keeps the ones that do not', async () => {
    await applyPending(HOSTED_DEFAULTS);
    await applyPending(CODEX_ONLY);

    expect(await exists(join(cwd, '.claude'))).toBe(false);
    expect(await exists(join(cwd, 'plugins/linteljs/.claude-plugin'))).toBe(false);
    expect(await exists(join(cwd, 'plugins/linteljs'))).toBe(true);
    expect(await exists(join(cwd, 'plugins'))).toBe(true);
  });

  it('drops a directory whose emptying waits on a deeper one met after it', async () => {
    const retired = ['retired/a.md', 'retired/deep/er/b.md'];

    await applyPending(HOSTED_DEFAULTS);
    await writeFile(join(cwd, MANAGED_PATH), `${JSON.stringify({ removable: retired })}\n`, 'utf8');
    await mkdir(join(cwd, 'retired/deep/er'), { recursive: true });

    for (const target of retired) {
      await writeFile(join(cwd, target), '# retired\n', 'utf8');
    }

    expect((await applyPending(HOSTED_DEFAULTS)).removed).toEqual(retired);
    expect(await exists(join(cwd, 'retired'))).toBe(false);
  });

  it('keeps a directory a project put its own file in', async () => {
    await applySync(cwd, HOSTED_DEFAULTS, ['.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    expect(await exists(join(cwd, '.claude/settings.json'))).toBe(false);
    expect(await readFile(join(cwd, '.claude/notes.md'), 'utf8')).toBe('# ours\n');
  });
});
