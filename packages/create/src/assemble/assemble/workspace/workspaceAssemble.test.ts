import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { answersFor, hostedAnswersFor } from '@mocks/answersFor';
import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { pick } from 'es-toolkit';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { manifestReader } from '@choices/read/manifest/manifestReader';
import { filesUnder, TEMPLATES_ROOT } from '@disk';
import { parsePackageJson } from '@emitters';
import { bannedPatternsEmitter } from '@emitters/always/banned-patterns/bannedPatternsEmitter';
import { commitGateEmitter } from '@emitters/always/commit-gate/commitGateEmitter';
import { gitignoreEmitter } from '@emitters/always/gitignore/gitignoreEmitter';
import { huskyEmitter } from '@emitters/always/husky/huskyEmitter';
import { emitLinteljsRecord, RECORD_MODULE } from '@emitters/always/linteljs-record/linteljsRecordEmitter';
import { patchPackageJson } from '@emitters/always/package-json/packageJsonEmitter';
import { buildScripts } from '@emitters/always/utils/scriptUtils';
import { workspaceRootEmitter } from '@emitters/layout/workspace-root/workspaceRootEmitter';
import { inProject } from '@emitters/utils/layoutUtils';
import { projectWriter } from '@io/write/project/projectWriter';

import { WriteFailed } from '../../errors/write-failed/writeFailedError';

import { FACTS } from './constants';
import {
  type AssembledProject,
  type Workspace,
  workspaceAssemble,
} from './workspaceAssemble';

import type { Answers, PackageManager } from '@config/types';

type DevPicked = Pick<Answers, 'packageManager' | 'layout' | 'testing'>
  & Partial<Pick<Answers, 'router' | 'mocking' | 'styling'>>;

const INSTALL_SCRIPTS = ['prepare', 'postinstall'];

const INSTALL_PARITY: (Pick<Answers, 'packageManager'> & Partial<Pick<Answers, 'router' | 'mocking'>>)[] = [
  {
    packageManager: 'pnpm',
    router: 'react-router',
  },
  {
    packageManager: 'pnpm',
    router: 'react-router-framework',
    mocking: 'msw',
  },
  {
    packageManager: 'yarn',
    router: 'react-router-framework',
    mocking: 'msw',
  },
  {
    packageManager: 'yarn',
    router: 'tanstack-router',
    mocking: 'msw',
  },
];

const SCRIPT_PARITY: (Pick<Answers, 'packageManager' | 'testing'> & Partial<Pick<Answers, 'router' | 'mocking'>>)[] = [
  {
    packageManager: 'pnpm',
    testing: 'vitest',
    router: 'react-router',
  },
  {
    packageManager: 'pnpm',
    testing: 'vitest',
    router: 'react-router-framework',
    mocking: 'msw',
  },
  {
    packageManager: 'yarn',
    testing: 'none',
    router: 'react-router-framework',
  },
  {
    packageManager: 'yarn',
    testing: 'vitest',
    router: 'tanstack-router',
    mocking: 'msw',
  },
];

const DEV_PARITY: DevPicked[] = [
  {
    packageManager: 'pnpm',
    layout: 'single',
    testing: 'vitest',
    router: 'react-router',
  },
  {
    packageManager: 'yarn',
    layout: 'single',
    testing: 'none',
    router: 'tanstack-router',
    styling: 'stylex',
  },
  {
    packageManager: 'pnpm',
    layout: 'monorepo',
    testing: 'vitest',
    router: 'react-router-framework',
    mocking: 'msw',
  },
  {
    packageManager: 'yarn',
    layout: 'monorepo',
    testing: 'vitest',
    router: 'react-router',
  },
];

const ROOT_PARITY: PackageManager[] = ['pnpm', 'yarn'];

const ROOT_FILES = [
  'package.json',
  '.gitignore',
  'lint-staged.config.js',
];

const GATE_BLOCK = /export const GATE = \[[\s\S]*?\] as const;\n/;

const COMMIT_GATE_PARITY: Pick<Answers, 'packageManager' | 'layout' | 'typeSafety'>[] = [
  {
    packageManager: 'pnpm',
    layout: 'single',
    typeSafety: 'strict',
  },
  {
    packageManager: 'yarn',
    layout: 'single',
    typeSafety: 'relaxed',
  },
  {
    packageManager: 'pnpm',
    layout: 'monorepo',
    typeSafety: 'relaxed',
  },
  {
    packageManager: 'yarn',
    layout: 'monorepo',
    typeSafety: 'strict',
  },
];

const EXECUTABLE = 0o111;

describe('workspaceAssemble', () => {
  let cwd = '';
  // The old emitters' output, for parity.
  let previous = '';

  const workspaceOf = async (projects: Workspace['projects']): Promise<Workspace> => {
    const questions = await manifestReader();
    const workspace: Workspace = {
      root: DRAWERS_ROOT,
      cwd,
      name: 'demo',
      host: {
        packageManager: 'pnpm',
        packageManagerVersion: '11.0.0',
        nodeVersion: '26.0.0',
      },
      questions,
      projects,
    };

    return workspace;
  };

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'workspace-assemble-');

    cwd = await mkdtemp(prefix);
    previous = await mkdtemp(prefix);
  });

  afterEach(async () => {
    const removed = [cwd, previous]
      .map(async (directory) => {
        await rm(directory, {
          recursive: true,
          force: true,
        });
      });

    await Promise.all(removed);
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
      scripts: {
        'lint': 'eslint . --concurrency auto',
        'lint:fix': 'eslint . --fix --concurrency auto',
        'lint:types': 'node scripts/checkBannedPatterns.ts src',
        'lint:css': 'stylelint "src/**/*.css" --allow-empty-input',
        'lint:css:fix': 'stylelint "src/**/*.css" --fix --allow-empty-input',
        'dev': 'vite',
        'build': 'vite build',
        'preview': 'vite preview',
        'typecheck': 'tsc --noEmit',
        'check': 'pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck && pnpm build',
        'prepare': 'husky',
      },
      dependencies: { react: '^19.0.0' },
      devDependencies: {
        '@commitlint/cli': '^21.2.3',
        '@commitlint/config-conventional': '^21.2.3',
        '@eslint-react/eslint-plugin': '^5.30.4',
        '@html-eslint/eslint-plugin': '^0.68.0',
        '@html-eslint/parser': '^0.68.0',
        '@linteljs/eslint-config': '^2.0.0',
        '@types/node': '^26.6.6',
        '@types/react': '^19.3.0',
        '@types/react-dom': '^19.3.0',
        '@vitejs/plugin-react': '^6.3.0',
        'eslint': '^10.15.0',
        'eslint-plugin-jsx-a11y-x': '^0.2.0',
        'eslint-plugin-react-hooks': '^7.1.1',
        'husky': '^9.1.7',
        'jiti': '^2.7.0',
        'lint-staged': '^17.6.0',
        'oxc-transform-react': '~0.156.0',
        'stylelint': '^17.16.0',
        'stylelint-config-recess-order': '^7.8.0',
        'stylelint-config-standard': '^40.0.0',
        'stylelint-order': '^8.1.1',
        'typescript': '~6.0.3',
        'vite': '^8.3.2',
        'vitest': '^4.0.0',
      },
    };
    const expectedText = `${JSON.stringify(expectedManifest, null, 2)}\n`;

    expect(written).toEqual([
      join('__mocks__', 'setupTests.tsx'),
      '.gitignore',
      join('.husky', 'commit-msg'),
      join('.husky', 'pre-commit'),
      'CLAUDE.txt',
      'commitlint.config.js',
      'eslint.config.ts',
      'index.html',
      'lint-staged.config.js',
      'linteljs.config.json',
      'package.json',
      join('scripts', 'checkBannedPatterns.ts'),
      join('scripts', 'typecheckStaged.ts'),
      join('scripts', 'utils', 'bannedPatternsUtils.ts'),
      join('scripts', 'utils', 'loggerUtils.ts'),
      join('scripts', 'utils', 'typecheckStagedUtils.ts'),
      join('src', 'config', 'linteljs.ts'),
      join('src', 'i18n', 'config.ts'),
      join('src', 'index.css'),
      join('src', 'locales', 'en', 'common.json'),
      join('src', 'main.test.txt'),
      join('src', 'main.txt'),
      join('src', 'routes.ts'),
      join('src', 'setup.txt'),
      'stylelint.config.js',
      'styles.txt',
      'tsconfig.json',
      'vite.config.ts',
      'vitest.config.ts',
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
    const manifest = await readFile(join(cwd, 'apps', 'web', 'package.json'), 'utf8');
    const parsed = parsePackageJson(manifest);

    expect(parsed.scripts).not.toHaveProperty('prepare');
    expect(parsed.scripts).toHaveProperty(['lint:types'], 'node ../../scripts/checkBannedPatterns.ts src');

    expect(written).toEqual([
      '.gitignore',
      join('.husky', 'commit-msg'),
      join('.husky', 'pre-commit'),
      join('apps', 'web', '.gitignore'),
      join('apps', 'web', 'eslint.config.ts'),
      join('apps', 'web', 'index.html'),
      join('apps', 'web', 'lint-staged.config.js'),
      join('apps', 'web', 'package.json'),
      join('apps', 'web', 'src', 'config', 'linteljs.ts'),
      join('apps', 'web', 'src', 'i18n', 'config.ts'),
      join('apps', 'web', 'src', 'main.txt'),
      join('apps', 'web', 'src', 'routes.ts'),
      join('apps', 'web', 'stylelint.config.js'),
      join('apps', 'web', 'tsconfig.json'),
      join('apps', 'web', 'vite.config.ts'),
      'CLAUDE.txt',
      'commitlint.config.js',
      'lint-staged.config.js',
      'linteljs.config.json',
      'package.json',
      join('packages', 'shared', 'lint-staged.config.js'),
      join('packages', 'shared', 'package.json'),
      join('scripts', 'checkBannedPatterns.ts'),
      join('scripts', 'typecheckStaged.ts'),
      join('scripts', 'utils', 'bannedPatternsUtils.ts'),
      join('scripts', 'utils', 'loggerUtils.ts'),
      join('scripts', 'utils', 'typecheckStagedUtils.ts'),
      'workspace.txt',
    ]);
  });

  it.each(INSTALL_PARITY)('writes the old install script and .gitignore for %o', async (picked) => {
    const { packageManager, ...chosen } = picked;
    const project: AssembledProject = {
      name: 'demo',
      answers: {
        target: 'react',
        layout: 'single',
        ...chosen,
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      host: {
        ...workspace.host,
        packageManager,
      },
    });

    const answers = answersFor(picked);
    const manifest = await readFile(join(cwd, 'package.json'), 'utf8');
    const ignored = await readFile(join(cwd, '.gitignore'), 'utf8');
    const parsed = parsePackageJson(manifest);
    const oldInstall = pick(buildScripts(answers), INSTALL_SCRIPTS);
    const oldIgnored = gitignoreEmitter(answers)
      .flatMap(({ content }) => {
        if (!('merge' in content)) {
          return [];
        }

        const text = [content.merge(null)];

        return text;
      });

    expect(parsed).toMatchObject({ scripts: oldInstall });
    expect([ignored]).toEqual(oldIgnored);
  });

  it.each(COMMIT_GATE_PARITY)('writes the old hooks, commit gate and banned-pattern scripts for %o', async (picked) => {
    const { packageManager, ...chosen } = picked;
    const project: AssembledProject = {
      name: 'web',
      answers: {
        target: 'react',
        ...chosen,
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      host: {
        ...workspace.host,
        packageManager,
      },
    });

    const answers = answersFor(picked);
    const oldArtifacts = [
      ...huskyEmitter(answers),
      ...commitGateEmitter(answers),
      ...bannedPatternsEmitter(answers),
    ];
    const directory = picked.layout === 'monorepo' ? 'apps/web' : '.';

    await projectWriter(previous, inProject(directory, oldArtifacts));

    const oldFiles = await filesUnder(previous);

    const snapshotOf = async (root: string) => {
      const files = oldFiles
        .map(async (path) => {
          const text = await readFile(join(root, path), 'utf8');
          const { mode } = await stat(join(root, path));
          const file = {
            path,
            text,
            executable: mode & EXECUTABLE,
          };

          return file;
        });

      return await Promise.all(files);
    };

    const written = await snapshotOf(cwd);
    const expected = await snapshotOf(previous);

    expect(oldFiles).toHaveLength(9);
    expect(written).toEqual(expected);
  });

  it.each(SCRIPT_PARITY)('writes the old scripts and gate from the real drawers for %o', async (picked) => {
    const { packageManager, ...chosen } = picked;
    const project: AssembledProject = {
      name: 'demo',
      answers: {
        target: 'react',
        layout: 'single',
        ...chosen,
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      root: TEMPLATES_ROOT,
      host: {
        ...workspace.host,
        packageManager,
      },
    });

    const answers = answersFor(picked);
    const manifest = await readFile(join(cwd, 'package.json'), 'utf8');
    const record = await readFile(join(cwd, RECORD_MODULE), 'utf8');
    const { scripts } = parsePackageJson(manifest);
    const old = emitLinteljsRecord({
      ...answers,
      ...workspace.host,
      packageManager,
    }, 'demo');
    const gate = (GATE_BLOCK.exec(record))?.[0];
    const oldGate = (GATE_BLOCK.exec(old))?.[0];

    expect(scripts).toEqual(buildScripts(answers));
    expect(gate).toBe(oldGate);
  });

  it.each(DEV_PARITY)('writes the old devDependencies from the real drawers for %o', async (picked) => {
    const { packageManager, ...chosen } = picked;
    const project: AssembledProject = {
      name: 'web',
      answers: {
        target: 'react',
        ...chosen,
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      root: TEMPLATES_ROOT,
      host: {
        ...workspace.host,
        packageManager,
      },
    });

    const directory = picked.layout === 'monorepo' ? join('apps', 'web') : '.';
    const manifest = await readFile(join(cwd, directory, 'package.json'), 'utf8');
    const { devDependencies } = parsePackageJson(manifest);
    const old = patchPackageJson({}, answersFor(picked));

    expect(devDependencies).toEqual(old.devDependencies);
  });

  it('picks the default drawer of an unanswered question, as a recorded config leaves router none out', async () => {
    const project: AssembledProject = {
      name: 'web',
      answers: {
        target: 'react',
        layout: 'monorepo',
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      root: TEMPLATES_ROOT,
    });

    const written = await filesUnder(cwd);

    expect(written).toContain(join('apps', 'web', 'src', 'router', 'router.tsx'));
  });

  it.each(ROOT_PARITY)('writes the old monorepo root files on %s', async (packageManager) => {
    const project: AssembledProject = {
      name: 'web',
      answers: {
        target: 'react',
        layout: 'monorepo',
        router: 'react-router',
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      root: TEMPLATES_ROOT,
      host: {
        ...workspace.host,
        packageManager,
      },
    });

    const answers = hostedAnswersFor({
      layout: 'monorepo',
      packageManager,
      packageManagerVersion: workspace.host.packageManagerVersion,
    });
    const old = workspaceRootEmitter({
      name: 'demo',
      projects: [{
        name: 'web',
        answers,
      }],
    });

    await projectWriter(previous, old);

    const textsOf = async (root: string) => {
      const texts = ROOT_FILES
        .map(async (path) => {
          return await readFile(join(root, path), 'utf8');
        });

      return await Promise.all(texts);
    };

    const written = await textsOf(cwd);
    const expected = await textsOf(previous);

    expect(written).toEqual(expected);
  });

  it('ignores the framework-mode output in eslint.config.ts', async () => {
    const project: AssembledProject = {
      name: 'demo',
      answers: {
        target: 'react',
        layout: 'single',
        router: 'react-router-framework',
      },
    };
    const workspace = await workspaceOf([project]);

    await workspaceAssemble({
      ...workspace,
      root: TEMPLATES_ROOT,
    });

    const eslintConfig = await readFile(join(cwd, 'eslint.config.ts'), 'utf8');

    expect(eslintConfig).toContain("'coverage/**',\n    '.react-router/**',\n    'build/**',\n  ],");
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

  it('keeps every fact key apart from the question keys, the place roots and base', async () => {
    const questions = await manifestReader();
    const keys = questions
      .map(({ key }) => {
        return key;
      });
    // The logical roots share.schema.json's `place` names: a fact folder named like one would swallow it.
    const taken = [
      'base',
      'pages',
      'ui',
      'features',
      'apis',
      'i18n',
      'styles',
      'public',
      ...keys,
    ];
    const clashing = FACTS
      .filter((fact) => {
        return taken.includes(fact);
      });

    expect(clashing).toEqual([]);
  });

  describe('with a drawer listing layers', () => {
    const plant = async (root: string, tree: Record<string, string>): Promise<void> => {
      const writes = Object.entries(tree)
        .map(async ([path, text]) => {
          const file = join(root, path);

          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, text, 'utf8');
        });

      await Promise.all(writes);
    };

    const LAYERED = {
      'frameworks/react/any/base/share.json': JSON.stringify({
        layers: ['kit/react'],
        platform: 'web',
        pageKind: 'routes',
        framework: 'react',
        place: {
          apis: 'src/lib/apis',
          public: 'public',
          naming: 'kebab',
          tests: '.spec',
        },
      }),
      'kit/react/base/apis/contactApi.ts': [
        "import { endpoints } from './contactEndpoints';",
        "import { urls } from '@apis/contactEndpoints';",
        '',
      ].join('\n'),
      'kit/react/base/apis/contactEndpoints.ts': 'export const endpoints = [];\n',
      'kit/react/platform/web/share.json': JSON.stringify({
        gitignore: ['kit-cache'],
        tsconfig: { compilerOptions: { paths: { '@apis/*': ['./src/lib/apis/*'] } } },
      }),
      'kit/react/platform/web/public/robots.txt': 'User-agent: *\n',
      'kit/react/platform/native/public/app.json': '{}',
    };

    const assembledFrom = async (tree: Record<string, string>): Promise<void> => {
      const root = join(cwd, 'root');

      await plant(root, tree);

      const project: AssembledProject = {
        name: 'web',
        answers: { target: 'react' },
      };
      const workspace = await workspaceOf([project]);

      await workspaceAssemble({
        ...workspace,
        root,
        cwd: join(cwd, 'out'),
      });
    };

    it('places the layer files its share and facts pick, imports rewritten', async () => {
      await assembledFrom(LAYERED);

      const out = join(cwd, 'out');
      const written = await filesUnder(out);
      const api = await readFile(join(out, 'src/lib/apis/contact-api.ts'), 'utf8');
      const gitignore = await readFile(join(out, '.gitignore'), 'utf8');
      const expectedApi = [
        "import { endpoints } from './contact-endpoints';",
        "import { urls } from '@apis/contact-endpoints';",
        '',
      ].join('\n');

      expect(written).toEqual(expect.arrayContaining([
        'public/robots.txt',
        'src/lib/apis/contact-api.ts',
        'src/lib/apis/contact-endpoints.ts',
      ]));

      expect(written).not.toContain('public/app.json');
      expect(api).toBe(expectedApi);

      expect(gitignore).toContain('kit-cache');
    });

    it('refuses a shell listing layers that leaves a fact unset', async () => {
      const share = JSON.stringify({
        layers: ['kit/react'],
        platform: 'web',
        framework: 'react',
      });
      const assembling = assembledFrom({
        ...LAYERED,
        'frameworks/react/any/base/share.json': share,
      });

      await expect(assembling).rejects.toThrow('the react shell lists layers but sets no pageKind');
    });

    it('refuses a placed layer file at a drawer file path', async () => {
      const assembling = assembledFrom({
        ...LAYERED,
        'frameworks/react/any/base/public/robots.txt': '',
      });

      await expect(assembling).rejects.toThrow('public/robots.txt is written twice');
    });
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
