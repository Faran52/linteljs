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

// Append import-free fragments after the target setup, so Angular imports remain first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  return [
    target.testSetup ?? 'mocks/setupTests.ts',
    ...(target.routerMocks === true ? ['mocks/setupTests.router.ts'] : []),
    ...(hasLibrary(answers, 'tanstack-query') ? ['mocks/setupTests.tanstackQuery.ts'] : []),
  ];
};

/**
 * Every file this CLI owns some or all of, which is what both `create` and `sync` write from. Template fills and
 * birth-only files are not here, because a project owns those after the first write.
 *
 * A merge belongs here too, not in a pipeline stage. `.gitignore` and `pnpm-workspace.yaml` were written by `create`
 * alone for exactly that reason, so a project that already existed never gained a block added to either: the
 * `peerDependencyRules` allowance shipped in 1.2.0 reached new projects and no old one, which a real migration found.
 *
 * `project` is what the directory already holds, in one record rather than an argument per discovered file, which let
 * `runPipeline` skip one silently. See `ProjectShape`.
 */
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
    // Stage `standard`, with the rest of the gate: the workflow runs `check`, which the package stage assembles.
    emitted('standard', '.github/workflows/ci.yml', emitCiWorkflow(answers)),
  ];

  // Relaxed projects get ambient type vocabulary; strict projects narrow with guards.
  if (answers.typeSafety === 'relaxed') {
    artifacts.push(copied('src/typings/customTypes.d.ts', 'typings/customTypes.d.ts'));
  }

  // Tailwind generates nothing until a stylesheet imports it, and only create-next-app writes that line itself.
  const styleEntry = styleEntryPath(answers, project.styleEntries);

  if (hasLibrary(answers, 'tailwind') && styleEntry !== undefined) {
    artifacts.push(merged('standard', styleEntry, mergeStyleEntry));
  }

  // `coverage/` and `*.tsbuildinfo` are this tool's output, so no generator ignores them. Merged rather than written,
  // to keep the scaffolder's own list (`.next/` and friends).
  /**
   * Merged, not written by the package stage alone, for the reason `.gitignore` and `pnpm-workspace.yaml` were
   * converted in 1.3.2: `sync` writes artifacts, so anything a stage writes never reaches a project that already
   * exists. Two of three reference migrations had to add dependencies by hand that their answers already implied,
   * because a release that adds a plugin to a layer reached every new project and no old one.
   */
  artifacts.push(merged('package', 'package.json', (current) => {
    return mergePackageJson(current, answers, name);
  }));

  artifacts.push(merged('package', '.gitignore', mergeGitignore));

  // Merged for the same reason, and only where it means something: discarding it breaks an install that already wrote
  // into it, and skipping it leaves `create-next-app`'s build opt-out in place.
  if (answers.packageManager === 'pnpm') {
    artifacts.push(merged('package', 'pnpm-workspace.yaml', (current) => {
      return mergePnpmWorkspace(current, answers);
    }));
  }

  /**
   * The three build configs are birth-only, not emitted every sync. What this CLI writes is a starting point that any
   * real project outgrows within its first feature: a Firefox extension needs one IIFE bundle per content script and
   * a native host target, and a project shipping a second build mode adds one. Re-emitting flattens that, and even
   * reporting it as `changed` invites a `--force` that does the flattening. Two migrations found this the same way,
   * which is why it is ownership rather than a better default.
   *
   * The vitest excludes are the sharper half of the same argument: they name `src/background/index.ts` and
   * `src/typings/**`, which are this CLI's own layout guesses, and a project excludes the entry points it actually
   * has. Only the emitted default can be written blind; the maintained version cannot.
   */
  if (viteConfig !== null) {
    artifacts.push({
      ...emitted('standard', 'vite.config.ts', viteConfig),
      preserve: true,
    });
  }

  // Astro's equivalent, and the only place its Vite options are read from.
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
    // Preserve project mocks in the setup file Vitest loads before collecting tests.
    artifacts.push({
      ...copied(setup, ...setupSources(answers, target)),
      preserve: true,
    });
  }

  return artifacts;
};
