import {
  type Answers,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { agentArtifacts } from '../agent-files/agentArtifacts';
import {
  type Artifact,
  copied,
  emitted,
  merged,
} from '../artifact/artifact';
import { emitAstroConfig } from '../astro-config/emitAstroConfig';
import { checkerArtifact, setupTestsPath } from '../banned-patterns/checkerArtifact';
import { emitCiWorkflow } from '../ci-workflow/emitCiWorkflow';
import { emitEslintConfig } from '../eslint-config/emitEslintConfig';
import { mergeGitignore } from '../gitignore/mergeGitignore';
import { mergePackageJson } from '../package-json/mergePackageJson';
import { mergePnpmWorkspace } from '../pnpm-workspace/mergePnpmWorkspace';
import { EMPTY_PROJECT, type ProjectShape } from '../project-shape/projectShape';
import { mergeStyleEntry } from '../style-entry/mergeStyleEntry';
import { styleEntryPath } from '../style-entry/styleEntryPath';
import { emitStylelintConfig } from '../stylelint-config/emitStylelintConfig';
import { emitTsconfig } from '../tsconfig/emitTsconfig';
import { emitViteConfig } from '../vite-config/emitViteConfig';
import { emitVitestConfig } from '../vitest-config/emitVitestConfig';

import type { TargetRecord } from '../../model/targets/record';

// Import-free fragments after the target setup, so Angular's imports stay first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  return [
    target.testSetup ?? 'mocks/setupTests.ts',
    ...(target.routerMocks === true ? ['mocks/setupTests.router.ts'] : []),
    ...(hasLibrary(answers, 'tanstack-query') ? ['mocks/setupTests.tanstackQuery.ts'] : []),
  ];
};

// Every file this CLI owns some or all of, which both `create` and `sync` write from. A merge belongs here, not in a
// stage: the `peerDependencyRules` allowance of 1.2.0 reached new projects and no old one while it was stage-only.
export const buildArtifacts = (
  answers: Answers,
  project: ProjectShape = EMPTY_PROJECT,
  name = '',
): Artifact[] => {
  const target = targetFor(answers);
  const setup = setupTestsPath(answers, project.setupTests);
  const viteConfig = emitViteConfig(answers);
  const astroConfig = emitAstroConfig(answers);
  const vitestConfig = emitVitestConfig(answers, setup);

  const artifacts: Artifact[] = [
    emitted('lint', 'eslint.config.js', emitEslintConfig(answers)),
    emitted('lint', 'stylelint.config.js', emitStylelintConfig(answers)),
    ...agentArtifacts(answers),
    checkerArtifact(answers),
    {
      ...copied('.husky/pre-commit', 'husky/pre-commit'),
      executable: true,
    },
    {
      ...copied('.husky/commit-msg', 'husky/commit-msg'),
      executable: true,
    },
    copied('lint-staged.config.js', 'lint-staged.config.js'),
    copied('commitlint.config.js', 'commitlint.config.js'),
    emitted('package', 'tsconfig.json', emitTsconfig(answers)),
    copied('scripts/typecheckStaged.ts', 'scripts/typecheckStaged.ts'),
    // Stage `standard`, with the rest of the gate.
    emitted('standard', '.github/workflows/ci.yml', emitCiWorkflow(answers)),
  ];

  if (answers.typeSafety === 'relaxed') {
    artifacts.push(copied('src/typings/customTypes.d.ts', 'typings/customTypes.d.ts'));
  }

  // Tailwind generates nothing until a stylesheet imports it; only create-next-app writes that line itself.
  const styleEntry = styleEntryPath(answers, project.styleEntries);

  if (hasLibrary(answers, 'tailwind') && styleEntry !== undefined) {
    artifacts.push(merged('standard', styleEntry, (current) => {
      return mergeStyleEntry(current, target.tailwind?.imports);
    }));
  }

  // Merged for the same reason `.gitignore` is: two of three migrations had to add dependencies by hand that their
  // answers already implied.
  artifacts.push(merged('package', 'package.json', (current) => {
    return mergePackageJson(current, answers, name);
  }));

  // Merged, to keep the scaffolder's own list.
  artifacts.push(merged('package', '.gitignore', mergeGitignore));

  // Only where it means something; discarding it breaks an install that already wrote into it.
  if (answers.packageManager === 'pnpm') {
    artifacts.push(merged('package', 'pnpm-workspace.yaml', (current) => {
      return mergePnpmWorkspace(current, answers);
    }));
  }

  // The build configs are birth-only: a real project outgrows them within its first feature, and re-emitting
  // flattens that. The vitest excludes name this CLI's layout guesses, which a project replaces with its own.
  if (viteConfig !== null) {
    artifacts.push({
      ...emitted('standard', 'vite.config.ts', viteConfig),
      preserve: true,
    });
  }

  if (astroConfig !== null) {
    artifacts.push({
      ...emitted('standard', 'astro.config.mjs', astroConfig),
      preserve: true,
    });
  }

  if (vitestConfig !== null) {
    artifacts.push({
      ...emitted('standard', 'vitest.config.ts', vitestConfig),
      preserve: true,
    });
  }

  if (hasTests(answers)) {
    // Keeps the project's own mocks.
    artifacts.push({
      ...copied(setup, ...setupSources(answers, target)),
      preserve: true,
    });
  }

  if (answers.packageManager === 'npm') {
    artifacts.push(copied('.npmrc', 'npm/npmrc'));
  }

  if (answers.packageManager === 'yarn') {
    artifacts.push(copied('.yarnrc.yml', 'yarn/yarnrc'));
  }

  return artifacts;
};
