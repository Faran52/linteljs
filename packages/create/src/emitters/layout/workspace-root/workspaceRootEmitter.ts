import { pick, toMerged } from 'es-toolkit';

import {
  type Answers,
  type Artifact,
  type Workspace,
} from '@config/types';

import { DEFAULT_ANSWERS } from '@answers';

import { eslintConfigEmitter } from '../../always/eslint-config/eslintConfigEmitter';
import { gitignoreEmitter } from '../../always/gitignore/gitignoreEmitter';
import { patchPackageJson } from '../../always/package-json/packageJsonEmitter';
import { buildTsconfig } from '../../always/tsconfig/tsconfigEmitter';
import {
  ROOT_DEV_DEPENDENCIES,
  ROOT_FIELDS,
  WORKSPACE_DIRECTORIES,
  WORKSPACE_GLOBS,
} from '../../constants';
import { copied, emitted } from '../../utils/artifactUtils';
import { rootCheckOf, rootNameOf } from '../../utils/layoutUtils';
import {
  buildDevDependencies,
  type PackageJson,
  serializedPackageJson,
} from '../../utils/packageJsonUtils';

type RootFiles = [Artifact, ...Artifact[]];

// The root lints and typechecks only its own tooling, as a plain TypeScript project.
export const rootAnswersOf = (answers: Pick<Answers, 'packageManager'>): Answers => {
  const rootAnswers: Answers = {
    ...DEFAULT_ANSWERS,
    packageManager: answers.packageManager,
    target: 'typescript',
    testing: 'none',
    ignores: WORKSPACE_DIRECTORIES
      .map((directory) => {
        return `${directory}/**`;
      }),
  };

  return rootAnswers;
};

// The root declares what any project's manifest would carry there, since a manager reads it nowhere else.
const rootManifest = (name: string, root: Answers, projects: readonly Answers[]): string => {
  const pm = root.packageManager;
  const rootFields = projects
    .reduce<PackageJson>((fields, answers) => {
      const manifest = patchPackageJson({}, answers);
      const own = pick(manifest, ROOT_FIELDS);

      return toMerged(fields, own);
    }, {});
  const devDependencies = [...projects, root]
    .reduce<Record<string, string>>((all, answers) => {
      const own = buildDevDependencies(answers);
      const merged = {
        ...all,
        ...own,
      };

      return merged;
    }, {});

  const manifest = {
    name: rootNameOf(name),
    private: true,
    type: 'module',
    // pnpm reads its globs from `pnpm-workspace.yaml`.
    ...(pm === 'pnpm' ? {} : { workspaces: WORKSPACE_GLOBS }),
    ...rootFields,
    scripts: {
      'lint': 'eslint . --concurrency auto',
      'lint:fix': 'eslint . --fix --concurrency auto',
      'typecheck': 'tsc --noEmit',
      'check': rootCheckOf(pm, name),
      [pm === 'yarn' ? 'postinstall' : 'prepare']: 'husky',
    },
    devDependencies: pick(devDependencies, ROOT_DEV_DEPENDENCIES),
  };

  const text = serializedPackageJson(manifest);

  return text;
};

const withoutStylelint = (source: string): string => {
  return source
    .split('\n')
    .filter((line) => {
      return !line.includes('stylelint');
    })
    .join('\n');
};

// The manifest, .gitignore and lint-staged config; the root's fields and dev dependencies are what `projects` need.
const workspaceRootOf = (name: string, root: Answers, projects: readonly Answers[]): RootFiles => {
  const manifest = rootManifest(name, root, projects);
  const lintStaged = copied('lint-staged.config.js');
  const files: RootFiles = [
    emitted('package', 'package.json', manifest),
    ...gitignoreEmitter(root),
    {
      ...lintStaged,
      content: {
        ...lintStaged.content,
        transform: withoutStylelint,
      },
    },
  ];

  return files;
};

export const workspaceRootEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  if (answers.layout === 'single') {
    return [];
  }

  const rootAnswers = rootAnswersOf(answers);
  const tsconfig = buildTsconfig(rootAnswers);
  const rootTsconfig = { ...tsconfig, exclude: [...tsconfig.exclude, ...WORKSPACE_DIRECTORIES] };
  const projects = workspace.projects
    .map((project) => {
      return project.answers;
    });
  const [manifest, ...rest] = workspaceRootOf(workspace.name, rootAnswers, projects);

  const artifacts: Artifact[] = [
    manifest,
    ...eslintConfigEmitter(rootAnswers),
    emitted('package', 'tsconfig.json', `${JSON.stringify(rootTsconfig, null, 2)}\n`),
    ...rest,
  ];

  return artifacts;
};
