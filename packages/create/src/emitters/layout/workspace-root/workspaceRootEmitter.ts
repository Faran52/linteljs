import { pick } from 'es-toolkit';

import {
  type Answers,
  type Artifact,
  type ProjectShape,
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
import { buildDevDependencies, serializedPackageJson } from '../../utils/packageJsonUtils';

// The root lints and typechecks only its own tooling, as a plain TypeScript project.
const rootAnswersOf = (answers: Answers): Answers => {
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

const rootManifest = (answers: Answers, name: string): string => {
  const pm = answers.packageManager;
  const app = patchPackageJson({}, answers);
  const devDependencies = buildDevDependencies(rootAnswersOf(answers));

  const manifest = {
    name: rootNameOf(name),
    private: true,
    type: 'module',
    // pnpm reads its globs from `pnpm-workspace.yaml`.
    ...(pm === 'pnpm' ? {} : { workspaces: WORKSPACE_GLOBS }),
    ...pick(app, ROOT_FIELDS),
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

export const workspaceRootEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  if (answers.layout === 'single') {
    return [];
  }

  const rootAnswers = rootAnswersOf(answers);
  const tsconfig = buildTsconfig(rootAnswers);
  const rootTsconfig = { ...tsconfig, exclude: [...tsconfig.exclude, ...WORKSPACE_DIRECTORIES] };

  const manifest = rootManifest(answers, name);
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
