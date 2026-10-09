import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { manifestReader } from '@choices/read/manifest/manifestReader';
import { filesUnder } from '@disk';

import { WriteFailed } from '../../errors/write-failed/writeFailedError';

import {
  type AssembledProject,
  type Workspace,
  workspaceAssemble,
} from './workspaceAssemble';

describe('workspaceAssemble', () => {
  let cwd = '';

  const workspaceOf = async (projects: Workspace['projects']): Promise<Workspace> => {
    const questions = await manifestReader();
    const workspace: Workspace = {
      root: DRAWERS_ROOT,
      cwd,
      name: 'demo',
      packageManager: 'pnpm@11.0.0',
      questions,
      projects,
    };

    return workspace;
  };

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'workspace-assemble-');

    cwd = await mkdtemp(prefix);
  });

  afterEach(async () => {
    await rm(cwd, {
      recursive: true,
      force: true,
    });
  });

  it('writes a single project from its drawers, agents and shares', async () => {
    const project: AssembledProject = {
      name: 'demo',
      answers: {
        target: 'react',
        layout: 'single',
        testing: 'vitest',
        styling: 'tailwind',
        languages: ['en'],
        agents: ['claude-code'],
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble(workspace);

    const written = await filesUnder(cwd);
    const manifest = await readFile(join(cwd, 'package.json'), 'utf8');
    const css = await readFile(join(cwd, 'src', 'index.css'), 'utf8');
    const expectedManifest = {
      name: 'demo',
      packageManager: 'pnpm@11.0.0',
      scripts: { dev: 'vite' },
      dependencies: { react: '^19.0.0' },
      devDependencies: { vitest: '^4.0.0' },
    };
    const expectedText = `${JSON.stringify(expectedManifest, null, 2)}\n`;

    expect(written).toEqual([
      'CLAUDE.txt',
      'eslint.config.ts',
      'linteljs.config.json',
      'package.json',
      join('src', 'index.css'),
      join('src', 'locales', 'en', 'common.json'),
      join('src', 'main.test.txt'),
      join('src', 'main.txt'),
      join('src', 'routes.ts'),
      join('src', 'setup.txt'),
      'styles.txt',
    ]);

    expect(manifest).toBe(expectedText);
    expect(css).toBe("@import 'tailwindcss';\n");
  });

  it('writes a monorepo root and each project in its group, tests left out where none', async () => {
    const web: AssembledProject = {
      name: 'web',
      answers: {
        target: 'react',
        layout: 'monorepo',
        testing: 'none',
        agents: ['claude-code'],
      },
    };
    const shared: AssembledProject = {
      name: 'shared',
      answers: {
        target: 'typescript',
        layout: 'monorepo',
      },
    };
    const workspace = await workspaceOf([web, shared]);

    await workspaceAssemble(workspace);

    const written = await filesUnder(cwd);

    expect(written).toEqual([
      join('apps', 'web', 'eslint.config.ts'),
      join('apps', 'web', 'package.json'),
      join('apps', 'web', 'src', 'main.txt'),
      join('apps', 'web', 'src', 'routes.ts'),
      'CLAUDE.txt',
      'linteljs.config.json',
      'package.json',
      join('packages', 'shared', 'package.json'),
      'workspace.txt',
    ]);
  });

  it('refuses a drawer file at a generated path', async () => {
    const root = join(cwd, 'root');
    const base = join(root, 'frameworks', 'react', 'any', 'base');

    await mkdir(base, { recursive: true });
    await writeFile(join(base, 'package.json'), '{}', 'utf8');

    const project: AssembledProject = {
      name: 'web',
      answers: { target: 'react' },
    };
    const workspace = await workspaceOf([project]);
    const assembling = workspaceAssemble({
      ...workspace,
      root,
      cwd: join(cwd, 'out'),
    });

    await expect(assembling).rejects.toThrow('package.json is written twice');
  });

  it('refuses a directory with anything in it', async () => {
    await writeFile(join(cwd, 'kept.txt'), 'kept', 'utf8');

    const project: AssembledProject = {
      name: 'demo',
      answers: { target: 'react' },
    };
    const workspace = await workspaceOf([project]);
    const assembling = workspaceAssemble(workspace);

    await expect(assembling).rejects.toThrow(WriteFailed);
  });
});
