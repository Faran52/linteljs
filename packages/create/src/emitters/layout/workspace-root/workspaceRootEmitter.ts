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

// The root lints and typechecks only its own tooling, as a plain TypeScript project.
export const rootAnswersOf = (answers: Answers): Answers => {
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
const rootManifest = (workspace: Workspace): string => {
  const [{ answers: first }] = workspace.projects;
  const pm = first.packageManager;
  const projects = workspace.projects
    .map(({ answers }) => {
      return answers;
    });
  const rootFields = projects
    .reduce<PackageJson>((fields, answers) => {
      const manifest = patchPackageJson({}, answers);
      const own = pick(manifest, ROOT_FIELDS);

      return toMerged(fields, own);
    }, {});
  const root = rootAnswersOf(first);
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
    name: rootNameOf(workspace.name),
    private: true,
    type: 'module',
    // pnpm reads its globs from `pnpm-workspace.yaml`.
    ...(pm === 'pnpm' ? {} : { workspaces: WORKSPACE_GLOBS }),
    ...rootFields,
    scripts: {
      'lint': 'eslint . --concurrency auto',
      'lint:fix': 'eslint . --fix --concurrency auto',
      'typecheck': 'tsc --noEmit',
      'check': rootCheckOf(pm, workspace.name),
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

export const workspaceRootEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  if (answers.layout === 'single') {
    return [];
  }

  const rootAnswers = rootAnswersOf(answers);
  const tsconfig = buildTsconfig(rootAnswers);
  const rootTsconfig = { ...tsconfig, exclude: [...tsconfig.exclude, ...WORKSPACE_DIRECTORIES] };

  const manifest = rootManifest(workspace);
  const lintStaged = copied('lint-staged.config.js');

  const artifacts: Artifact[] = [
    emitted('package', 'package.json', manifest),
    ...eslintConfigEmitter(rootAnswers),
    emitted('package', 'tsconfig.json', `${JSON.stringify(rootTsconfig, null, 2)}\n`),
    ...gitignoreEmitter(rootAnswers),
    {
      ...lintStaged,
      content: {
        ...lintStaged.content,
        transform: withoutStylelint,
      },
    },
  ];

  return artifacts;
};
