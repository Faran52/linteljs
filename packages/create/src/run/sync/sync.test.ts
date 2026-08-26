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
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers, DEFAULT_ANSWERS } from '../../model/answers/answers';
import { exists } from '../utils/fsUtils';

import {
  applySync,
  planSync,
  type SyncResult,
} from './sync';

const CLAUDE_HOOK = 'plugins/linteljs/hooks/git-safety-guard.sh';

// The three files only a Claude Code project gets, and the whole of what removal may touch here.
const CLAUDE_ONLY = [
  '.claude/settings.json',
  'plugins/linteljs/.claude-plugin/plugin.json',
  'plugins/linteljs/.claude-plugin/marketplace.json',
];

const CODEX_ONLY: Answers = {
  ...DEFAULT_ANSWERS,
  agents: ['codex'],
};

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-sync-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

// `sync --force` without the CLI.
const applyPending = async (answers: Answers): Promise<SyncResult> => {
  const { pending } = await planSync(cwd, answers);

  return await applySync(cwd, answers, pending.map((entry) => {
    return entry.target;
  }));
};

const statusOf = async (answers: Answers, target: string): Promise<string | undefined> => {
  const { entries } = await planSync(cwd, answers);

  return entries.find((entry) => {
    return entry.target === target;
  })?.status;
};

describe('planSync', () => {
  it('marks every artifact missing against an empty directory, and pending all of them', async () => {
    const plan = await planSync(cwd, DEFAULT_ANSWERS);

    expect(plan.entries.length).toBeGreaterThan(0);
    expect(plan.entries.every((entry) => {
      return entry.status === 'missing';
    })).toBe(true);
    expect(plan.pending).toEqual(plan.entries);
  });

  it('marks a written artifact unchanged and leaves it out of pending', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['eslint.config.js']);

    const plan = await planSync(cwd, DEFAULT_ANSWERS);
    const entry = plan.entries.find((candidate) => {
      return candidate.target === 'eslint.config.js';
    });

    expect(entry?.status).toBe('unchanged');
    expect(plan.pending.some((candidate) => {
      return candidate.target === 'eslint.config.js';
    })).toBe(false);
  });

  it('marks a locally edited artifact changed and carries a diff of the edit', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['eslint.config.js']);
    await writeFile(join(cwd, 'eslint.config.js'), '// edited locally\n', 'utf8');

    const plan = await planSync(cwd, DEFAULT_ANSWERS);
    const entry = plan.entries.find((candidate) => {
      return candidate.target === 'eslint.config.js';
    });

    expect(entry?.status).toBe('changed');
    expect(entry?.diff).toContain('edited locally');
    expect(plan.pending).toContainEqual(entry);
  });

  // An edit is the project's; only absence is still lintel's to fix.
  it('calls an edited preserved artifact unchanged and its absence missing', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['CLAUDE.md']);
    await writeFile(join(cwd, 'CLAUDE.md'), '# our own instructions\n', 'utf8');

    expect(await statusOf(DEFAULT_ANSWERS, 'CLAUDE.md')).toBe('unchanged');

    await rm(join(cwd, 'CLAUDE.md'));

    expect(await statusOf(DEFAULT_ANSWERS, 'CLAUDE.md')).toBe('missing');
  });

  // A bare catch that read any read failure as absence would report this as "missing" and invite a
  // `--force` that then fails writing over a directory, hiding the real problem behind the wrong status.
  it('rejects rather than reporting missing when a target cannot be read for a reason other than absence', async () => {
    await mkdir(join(cwd, 'eslint.config.js'));

    await expect(planSync(cwd, DEFAULT_ANSWERS)).rejects.toThrow();
  });

  it('marks a generated agent file obsolete once the answers stop selecting its host', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, CLAUDE_ONLY);

    const { entries, pending } = await planSync(cwd, CODEX_ONLY);
    const obsolete = entries.filter((entry) => {
      return entry.status === 'obsolete';
    });

    expect(obsolete.map((entry) => {
      return entry.target;
    })).toEqual(CLAUDE_ONLY);
    expect(obsolete.every((entry) => {
      return entry.diff === '';
    })).toBe(true);
    expect(pending).toEqual(expect.arrayContaining(obsolete));
  });

  // Exact paths, not prefixes: neither adapter is in the inventory, nor is a file this CLI never wrote.
  it('leaves the deselected adapter and unknown files below a generated directory alone', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['CLAUDE.md', '.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    const obsolete = (await planSync(cwd, CODEX_ONLY)).entries.filter((entry) => {
      return entry.status === 'obsolete';
    }).map((entry) => {
      return entry.target;
    });

    expect(obsolete).toEqual(['.claude/settings.json']);
    expect(obsolete).not.toContain('CLAUDE.md');
  });

  it('reports nothing obsolete for a path the project never had', async () => {
    const plan = await planSync(cwd, CODEX_ONLY);

    expect(plan.entries.some((entry) => {
      return entry.status === 'obsolete';
    })).toBe(false);
  });
});

describe('applySync', () => {
  it('writes only the targets it is given', async () => {
    const { written, removed } = await applySync(cwd, DEFAULT_ANSWERS, ['eslint.config.js']);

    expect(written).toEqual(['eslint.config.js']);
    expect(removed).toEqual([]);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
    expect(await exists(join(cwd, 'stylelint.config.js'))).toBe(false);
  });

  it('writes the file content that planSync would call unchanged afterwards', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['eslint.config.js']);

    const written = await readFile(join(cwd, 'eslint.config.js'), 'utf8');

    expect(written).toContain('defineConfig');
  });

  it('refuses to write a generated artifact through a symbolic link', async () => {
    const external = join(cwd, 'external-eslint.config.js');

    await writeFile(external, '// external config\n', 'utf8');
    await symlink(external, join(cwd, 'eslint.config.js'));

    await expect(applySync(cwd, DEFAULT_ANSWERS, ['eslint.config.js']))
      .rejects.toThrow('Refusing to write eslint.config.js: target is a symbolic link');
    await expect(readFile(external, 'utf8')).resolves.toBe('// external config\n');
  });

  it('refuses to remove an obsolete file through a symbolic-link parent', async () => {
    const external = join(cwd, 'external-claude');

    await mkdir(external);
    await writeFile(join(external, 'settings.json'), '{"external":true}\n', 'utf8');
    await symlink(external, join(cwd, '.claude'));

    await expect(applySync(cwd, CODEX_ONLY, ['.claude/settings.json']))
      .rejects.toThrow('Refusing to use .claude/settings.json: a parent directory is a symbolic link');
    await expect(readFile(join(external, 'settings.json'), 'utf8')).resolves.toBe('{"external":true}\n');
  });

  it('makes an executable artifact executable on disk', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, [CLAUDE_HOOK]);

    const mode = (await stat(join(cwd, CLAUDE_HOOK))).mode;

    expect(mode & 0o111).toBe(0o111);
  });

  // The setup file, which is preserved outright: the checker is merged instead, since it holds the standard's
  // pattern list as well as the project's own blocks.
  it('writes a preserved file when missing, and leaves it alone once it exists', async () => {
    const setup = '__mocks__/setupTests.tsx';
    const first = await applySync(cwd, DEFAULT_ANSWERS, [setup]);

    expect(first.written).toEqual([setup]);

    await writeFile(join(cwd, setup), '// the project own setup\n', 'utf8');

    const second = await applySync(cwd, DEFAULT_ANSWERS, [setup]);

    expect(second.written).toEqual([]);
    expect(await readFile(join(cwd, setup), 'utf8')).toBe('// the project own setup\n');
  });

  it('removes the obsolete files it is given and reports each one', async () => {
    await applyPending(DEFAULT_ANSWERS);

    const { removed } = await applyPending(CODEX_ONLY);

    expect(removed).toEqual(CLAUDE_ONLY);

    for (const target of CLAUDE_ONLY) {
      expect(await exists(join(cwd, target))).toBe(false);
    }

    expect(await exists(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(await exists(join(cwd, '.agents/plugins/marketplace.json'))).toBe(true);
    // Not in the inventory, so `--force` has no mandate over it even with its host gone.
    expect(await exists(join(cwd, 'CLAUDE.md'))).toBe(true);
  });

  it('removes nothing it was not given, even where the plan called it obsolete', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, CLAUDE_ONLY);

    const { removed } = await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    expect(removed).toEqual(['.claude/settings.json']);
    expect(await exists(join(cwd, 'plugins/linteljs/.claude-plugin/plugin.json'))).toBe(true);
  });

  // An empty `.claude/` left behind would read as if the host were still configured.
  it('drops the directories that empty out and keeps the ones that do not', async () => {
    await applyPending(DEFAULT_ANSWERS);
    await applyPending(CODEX_ONLY);

    expect(await exists(join(cwd, '.claude'))).toBe(false);
    expect(await exists(join(cwd, 'plugins/linteljs/.claude-plugin'))).toBe(false);
    // The same walk up reaches these, and they still hold the shared skill and hooks.
    expect(await exists(join(cwd, 'plugins/linteljs'))).toBe(true);
    expect(await exists(join(cwd, 'plugins'))).toBe(true);
  });

  it('keeps a directory a project put its own file in', async () => {
    await applySync(cwd, DEFAULT_ANSWERS, ['.claude/settings.json']);
    await writeFile(join(cwd, '.claude/notes.md'), '# ours\n', 'utf8');

    await applySync(cwd, CODEX_ONLY, ['.claude/settings.json']);

    expect(await exists(join(cwd, '.claude/settings.json'))).toBe(false);
    expect(await readFile(join(cwd, '.claude/notes.md'), 'utf8')).toBe('# ours\n');
  });
});
