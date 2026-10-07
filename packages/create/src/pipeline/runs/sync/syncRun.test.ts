import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { MANAGED_PATH, PLUGIN_ROOT } from '@config/constants';

import { exists } from '@disk';
import {
  buildDevDependencies,
  emitEslintConfig,
  parsePackageJson,
} from '@emitters';

import {
  planSync,
  runnerSwitch,
  syncPlugin,
  writeDependencies,
  writeLintConfig,
} from './syncRun';

import type { HostedAnswers } from '@config/types';

const PROBE_LIMIT = 100;

const probes = vi.hoisted(() => {
  const counter = { count: 0 };

  return counter;
});

// A backup probe that never finds a free name throws here rather than run into the suite's timeout.
vi.mock('@disk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@disk')>();

  const entryExists = async (path: string): Promise<boolean> => {
    probes.count += 1;

    if (probes.count > PROBE_LIMIT) {
      throw new Error(`more than ${String(PROBE_LIMIT)} probes`);
    }

    return await actual.entryExists(path);
  };

  const mocked = {
    ...actual,
    entryExists,
  };

  return mocked;
});

const CLAUDE_PLUGIN = 'plugins/linteljs/.claude-plugin/plugin.json';
const CLAUDE_MARKETPLACE = 'plugins/linteljs/.claude-plugin/marketplace.json';
const TYPE_STANDARDS = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

const CODEX_ONLY: HostedAnswers = {
  ...HOSTED_DEFAULTS,
  agents: ['codex'],
};

let cwd = '';

beforeEach(async () => {
  probes.count = 0;
  const prefix = join(tmpdir(), 'linteljs-sync-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const plant = async (target: string, text: string): Promise<void> => {
  const path = join(cwd, target);

  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, text, 'utf8');
};

const read = async (target: string): Promise<string> => {
  return await readFile(join(cwd, target), 'utf8');
};

const plantRecord = async (removable: string[]): Promise<void> => {
  await plant(MANAGED_PATH, `${JSON.stringify({ removable })}\n`);
};

const plantPackageJson = async (devDependencies: Record<string, string>): Promise<void> => {
  const manifest = {
    name: 'kept',
    scripts: { check: 'our own gate' },
    dependencies: { react: '^99.0.0' },
    devDependencies,
  };

  await plant('package.json', `${JSON.stringify(manifest)}\n`);
};

const statusLineSettings = (main: string, subagent: string): string => {
  const settings = {
    includeCoAuthoredBy: false,
    statusLine: {
      type: 'command',
      command: `node "\${CLAUDE_PROJECT_DIR}/plugins/linteljs/hooks/${main}"`,
    },
    subagentStatusLine: {
      type: 'command',
      command: `node "\${CLAUDE_PROJECT_DIR}/plugins/linteljs/hooks/${subagent}"`,
    },
  };

  return `${JSON.stringify(settings, null, 2)}\n`;
};

const created = buildDevDependencies(HOSTED_DEFAULTS);

const versionOf = (name: string): string => {
  return created[name] ?? '';
};

describe('planSync', () => {
  it('finds no dependency drift and a missing eslint config in an empty directory', async () => {
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    const expected = {
      upgrades: [],
      peers: [],
      eslintConfig: { status: 'missing' },
    };
    expect(plan).toEqual(expected);
  });

  it('lists an old @linteljs/* version, and the lint dependencies missing or behind, and nothing else', async () => {
    await plantPackageJson({
      '@linteljs/eslint-config': '^1.5.0',
      'eslint': '^1.0.0',
      'typescript': '^99.0.0',
    });

    const { upgrades, peers } = await planSync(cwd, HOSTED_DEFAULTS);

    const expectedUpgrades = [{
      name: '@linteljs/eslint-config',
      from: '^1.5.0',
      to: versionOf('@linteljs/eslint-config'),
    }];
    expect(upgrades).toEqual(expectedUpgrades);
    const peerNames = peers
      .map(({ name }) => {
        return name;
      });
    expect(peerNames).toContain('eslint');
    expect(peerNames).not.toContain('typescript');
    expect(peerNames).not.toContain('husky');
    const eslintPeer = peers
      .find(({ name }) => {
        return name === 'eslint';
      });
    const expectedEslint = {
      name: 'eslint',
      from: '^1.0.0',
      to: versionOf('eslint'),
    };
    expect(eslintPeer).toEqual(expectedEslint);
  });

  it('calls eslint.config.ts unchanged when it is what linteljs writes', async () => {
    await plant('eslint.config.ts', emitEslintConfig(HOSTED_DEFAULTS));

    const { eslintConfig } = await planSync(cwd, HOSTED_DEFAULTS);

    expect(eslintConfig).toEqual({ status: 'unchanged' });
  });

  it.each<[string, string[], string]>([
    [
      'no backup yet',
      [],
      'eslint.config.ts.bak',
    ],
    [
      'a .bak',
      ['eslint.config.ts.bak'],
      'eslint.config.ts.bak.1',
    ],
    [
      'a .bak and a .bak.1',
      ['eslint.config.ts.bak', 'eslint.config.ts.bak.1'],
      'eslint.config.ts.bak.2',
    ],
  ])('backs an edited config up past every earlier backup, with %s', async (_, earlier, backup) => {
    await plant('eslint.config.ts', '// ours\n');

    for (const target of earlier) {
      await plant(target, '// earlier\n');
    }

    const { eslintConfig } = await planSync(cwd, HOSTED_DEFAULTS);

    const expected = {
      status: 'changed',
      path: 'eslint.config.ts',
      backup,
    };
    expect(eslintConfig).toEqual(expected);
  });

  it('plans the first spelling ESLint would load, even one linteljs never writes', async () => {
    await plant('eslint.config.ts', '// ours\n');
    await plant('eslint.config.cjs', '// ours\n');

    const { eslintConfig } = await planSync(cwd, HOSTED_DEFAULTS);

    const expected = {
      status: 'changed',
      path: 'eslint.config.cjs',
      backup: 'eslint.config.cjs.bak',
    };
    expect(eslintConfig).toEqual(expected);
  });

  it('calls a config linteljs would write changed under another spelling', async () => {
    await plant('eslint.config.js', emitEslintConfig(HOSTED_DEFAULTS));

    const { eslintConfig } = await planSync(cwd, HOSTED_DEFAULTS);

    const expected = {
      status: 'changed',
      path: 'eslint.config.js',
      backup: 'eslint.config.js.bak',
    };
    expect(eslintConfig).toEqual(expected);
  });
});

describe('syncPlugin', () => {
  it('writes the plugin folder and nothing outside it, reporting all but its record', async () => {
    const { written, removed } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    const outside = written
      .filter((target) => {
        return !target.startsWith(PLUGIN_ROOT);
      });
    expect(outside).toEqual([]);
    expect(written).toContain(TYPE_STANDARDS);
    expect(written).not.toContain(MANAGED_PATH);
    expect(removed).toEqual([]);
    const entries = await readdir(cwd);
    expect(entries).toEqual(['plugins']);
    const hasRecord = await exists(join(cwd, MANAGED_PATH));
    expect(hasRecord).toBe(true);
  });

  it('writes nothing on a second run', async () => {
    await syncPlugin(cwd, HOSTED_DEFAULTS);

    const second = await syncPlugin(cwd, HOSTED_DEFAULTS);

    const expected = {
      written: [],
      removed: [],
    };
    expect(second).toEqual(expected);
  });

  it('points the status lines of a project on the old script names at the scripts sync writes', async () => {
    const old = ['plugins/linteljs/hooks/mainStatusLine.ts', 'plugins/linteljs/hooks/subagentStatusLine.ts'];

    for (const target of old) {
      await plant(target, '// retired\n');
    }

    await plantRecord(old);
    await plant('.claude/settings.json', statusLineSettings('mainStatusLine.ts', 'subagentStatusLine.ts'));

    const { written, removed } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(removed).toEqual(old);
    expect(written).toContain('.claude/settings.json');
    const settings = await read('.claude/settings.json');
    const migrated = statusLineSettings('mainStatusLineHook.ts', 'subagentStatusLineHook.ts');
    expect(settings).toBe(migrated);
    const scripts = [...settings.matchAll(/plugins\/linteljs\/hooks\/\w+\.ts/gu)]
      .map(([target]) => {
        return target;
      });
    const present = await Promise.all(scripts
      .map(async (target) => {
        return await exists(join(cwd, target));
      }));
    expect(scripts).toHaveLength(2);
    expect(present).toEqual([true, true]);
  });

  it('leaves settings already on the current script names untouched', async () => {
    const current = statusLineSettings('mainStatusLineHook.ts', 'subagentStatusLineHook.ts');
    await plant('.claude/settings.json', current);

    const { written } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(written).not.toContain('.claude/settings.json');
    const settings = await read('.claude/settings.json');
    expect(settings).toBe(current);
  });

  it('restores an edited plugin file and reports it alone', async () => {
    await syncPlugin(cwd, HOSTED_DEFAULTS);
    const shipped = await read(TYPE_STANDARDS);
    await writeFile(join(cwd, TYPE_STANDARDS), '# ours\n', 'utf8');

    const { written } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(written).toEqual([TYPE_STANDARDS]);
    const restored = await read(TYPE_STANDARDS);
    expect(restored).toBe(shipped);
  });

  it('removes what a dropped host owned in the folder, and prunes the directories that empty out', async () => {
    await syncPlugin(cwd, HOSTED_DEFAULTS);

    const { removed } = await syncPlugin(cwd, CODEX_ONLY);

    expect(removed).toEqual([
      CLAUDE_MARKETPLACE,
      CLAUDE_PLUGIN,
      'plugins/linteljs/hooks/checkBand.tsx',
      'plugins/linteljs/hooks/hooks.json',
      'plugins/linteljs/types/index.d.ts',
    ]);

    const hasTypes = await exists(join(cwd, 'plugins/linteljs/types'));
    expect(hasTypes).toBe(false);
    const hasClaudePlugin = await exists(join(cwd, 'plugins/linteljs/.claude-plugin'));
    expect(hasClaudePlugin).toBe(false);
    const hasFolder = await exists(join(cwd, 'plugins/linteljs'));
    expect(hasFolder).toBe(true);
  });

  it('drops a directory whose emptying waits on a deeper one met after it', async () => {
    const retired = ['plugins/linteljs/retired/a.md', 'plugins/linteljs/retired/deep/er/b.md'];

    for (const target of retired) {
      await plant(target, '# retired\n');
    }

    await plantRecord(retired);

    const { removed } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(removed).toEqual(retired);
    const hasRetired = await exists(join(cwd, 'plugins/linteljs/retired'));
    expect(hasRetired).toBe(false);
  });

  it('keeps a directory a project put its own file in', async () => {
    await syncPlugin(cwd, HOSTED_DEFAULTS);
    await plant('plugins/linteljs/.claude-plugin/notes.md', '# ours\n');

    await syncPlugin(cwd, CODEX_ONLY);

    const notes = await read('plugins/linteljs/.claude-plugin/notes.md');
    expect(notes).toBe('# ours\n');
  });

  it.each([
    '.claude/settings.json',
    'plugins/linteljs/../outside.md',
    'plugins/linteljs/./dotted.md',
    'plugins/linteljs/kept/',
  ])('never deletes the recorded %s', async (target) => {
    await plant('.claude/settings.json', '{}\n');
    await plant('plugins/outside.md', '# ours\n');
    await plant('plugins/linteljs/dotted.md', '# ours\n');
    await plant('plugins/linteljs/kept/file.md', '# ours\n');
    await plantRecord([target]);

    const { removed } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(removed).toEqual([]);
    const planted = [
      '.claude/settings.json',
      'plugins/outside.md',
      'plugins/linteljs/dotted.md',
    ];
    const survivors = await Promise.all(planted
      .map(async (path) => {
        return await exists(join(cwd, path));
      }));

    expect(survivors).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('skips a recorded file that is already gone', async () => {
    await plantRecord(['plugins/linteljs/gone.md']);

    const { removed } = await syncPlugin(cwd, HOSTED_DEFAULTS);

    expect(removed).toEqual([]);
  });

  it('refuses to write a plugin file through a symbolic link', async () => {
    const external = join(cwd, 'external.md');

    await writeFile(external, '# external\n', 'utf8');
    await mkdir(join(cwd, 'plugins/linteljs/skills/linteljs/references'), { recursive: true });
    await symlink(external, join(cwd, TYPE_STANDARDS));

    const syncing = syncPlugin(cwd, HOSTED_DEFAULTS);

    await expect(syncing).rejects.toThrow('symbolic link');
    const kept = await readFile(external, 'utf8');
    expect(kept).toBe('# external\n');
  });

  it('refuses to remove a recorded file through a symbolic-link parent', async () => {
    const external = join(cwd, 'external');

    await mkdir(external);
    await writeFile(join(external, 'plugin.json'), '{"external":true}\n', 'utf8');
    await mkdir(join(cwd, 'plugins/linteljs'), { recursive: true });
    await symlink(external, join(cwd, 'plugins/linteljs/.claude-plugin'));
    await plantRecord([CLAUDE_PLUGIN]);

    const syncing = syncPlugin(cwd, CODEX_ONLY);

    await expect(syncing).rejects.toThrow('a parent directory is a symbolic link');
    const kept = await readFile(join(external, 'plugin.json'), 'utf8');
    expect(kept).toBe('{"external":true}\n');
  });
});

describe('writeDependencies', () => {
  it('moves only the named entries, each in the field the project keeps it in', async () => {
    await plantPackageJson({ eslint: '^1.0.0' });
    const changes = [
      {
        name: 'eslint',
        from: '^1.0.0',
        to: '^9.0.0',
      },
      {
        name: 'react',
        to: '^100.0.0',
      },
      {
        name: 'typescript',
        to: '^6.0.0',
      },
    ];

    await writeDependencies(cwd, changes);

    const text = await read('package.json');
    const written = parsePackageJson(text);
    const expected = {
      name: 'kept',
      scripts: { check: 'our own gate' },
      dependencies: { react: '^100.0.0' },
      devDependencies: {
        eslint: '^9.0.0',
        typescript: '^6.0.0',
      },
    };
    expect(written).toEqual(expected);
  });

  it('starts a package.json the project does not have', async () => {
    await writeDependencies(cwd, [{
      name: 'eslint',
      to: '^9.0.0',
    }]);

    const text = await read('package.json');
    const written = parsePackageJson(text);
    const expected = { devDependencies: { eslint: '^9.0.0' } };
    expect(written).toEqual(expected);
  });
});

describe('writeLintConfig', () => {
  const emitted = emitEslintConfig(HOSTED_DEFAULTS);

  it('writes a missing config', async () => {
    await writeLintConfig(cwd, HOSTED_DEFAULTS, { status: 'missing' });

    const written = await read('eslint.config.ts');
    expect(written).toBe(emitted);
  });

  it('moves the project\'s config to its backup before writing the new one', async () => {
    await plant('eslint.config.mjs', '// ours\n');
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    await writeLintConfig(cwd, HOSTED_DEFAULTS, plan.eslintConfig);

    const backup = await read('eslint.config.mjs.bak');
    expect(backup).toBe('// ours\n');
    const hasOriginal = await exists(join(cwd, 'eslint.config.mjs'));
    expect(hasOriginal).toBe(false);
    const written = await read('eslint.config.ts');
    expect(written).toBe(emitted);
  });

  it('moves a config that is a symbolic link as the link, leaving what it points at alone', async () => {
    const external = join(cwd, 'external.js');

    await writeFile(external, '// external\n', 'utf8');
    await symlink(external, join(cwd, 'eslint.config.ts'));
    const plan = await planSync(cwd, HOSTED_DEFAULTS);

    await writeLintConfig(cwd, HOSTED_DEFAULTS, plan.eslintConfig);

    const kept = await readFile(external, 'utf8');
    expect(kept).toBe('// external\n');
    const backup = await read('eslint.config.ts.bak');
    expect(backup).toBe('// external\n');
    const written = await read('eslint.config.ts');
    expect(written).toBe(emitted);
  });
});

describe('runnerSwitch', () => {
  const REACT_NATIVE: HostedAnswers = {
    ...HOSTED_DEFAULTS,
    target: 'react-native',
  };

  const withDevDependencies = async (devDependencies: Record<string, string>): Promise<void> => {
    const manifest = JSON.stringify({ devDependencies });

    await writeFile(join(cwd, 'package.json'), `${manifest}\n`, 'utf8');
  };

  it('names the runner a project installed when the target now runs another', async () => {
    await withDevDependencies({ vitest: '^5.0.2' });

    const switched = await runnerSwitch(cwd, REACT_NATIVE);

    expect(switched).toStrictEqual({
      from: 'vitest',
      to: 'jest',
    });
  });

  it.each<[string, Record<string, string>]>([
    ['the target runner installed beside the other', { jest: '^29.7.0', vitest: '^5.0.2' }],
    ['no runner installed', { typescript: '^6.0.3' }],
  ])('finds no switch with %s', async (_, devDependencies) => {
    await withDevDependencies(devDependencies);

    const switched = await runnerSwitch(cwd, REACT_NATIVE);

    expect(switched).toBeNull();
  });

  it('finds no switch in a project without devDependencies', async () => {
    await writeFile(join(cwd, 'package.json'), '{}\n', 'utf8');

    const switched = await runnerSwitch(cwd, REACT_NATIVE);

    expect(switched).toBeNull();
  });

  it('finds no switch without a package.json', async () => {
    const switched = await runnerSwitch(cwd, REACT_NATIVE);

    expect(switched).toBeNull();
  });

  it('finds no switch where the project declined a suite', async () => {
    await withDevDependencies({ vitest: '^5.0.2' });

    const switched = await runnerSwitch(cwd, {
      ...REACT_NATIVE,
      testing: 'none',
    });

    expect(switched).toBeNull();
  });
});
