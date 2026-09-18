import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  browsersOf,
  hasLibrary,
  hasTests,
} from '../answers/answers';
import { CONFIG_PATH } from '../answers/lintelConfig';
import { type Artifact, buildArtifacts } from '../emitters';
import { type Stage, STAGES } from '../emitters/artifact';
import { emitLintelConfig } from '../emitters/lintel-config/emitLintelConfig';
import { emitManifest } from '../emitters/manifest/emitManifest';
import { emitReadme } from '../emitters/readme/emitReadme';
import { applyArtifact, writeProjectFile } from '../files/projectFiles';
import { readProjectShape } from '../files/readProjectShape';
import { ASSETS_ROOT } from '../files/shippedAssets';
import { exists } from '../files/utils/fsUtils';
import { git } from '../process/git';
import { run } from '../process/run';
import { scaffoldCommand } from '../process/scaffoldCommand';
import { targetFor } from '../targets';

import { runFixPass } from './fixPass';
import { repairScaffoldedOutput } from './repair';
import { rewriteScaffoldedSource } from './rewrite';

import type { Answers } from '../answers/answers';

export interface PipelineOptions {
  name: string;
  cwd: string;
  answers: Answers;
  skip: Stage[];
  // Treat the directory as fresh scaffolder output although this run did not scaffold it.
  fresh?: boolean;
  onWrite?: (path: string) => void;
  // What happened that was not a file write.
  onNotice?: (message: string) => void;
  // Called as each stage starts, with its position in the full list.
  onStage?: (stage: Stage, index: number, count: number) => void;
}

type StageRunner = (
  options: PipelineOptions,
  artifacts: Artifact[],
  stage: Stage,
) => Promise<void> | void;

const write = async (options: PipelineOptions, relative: string, text: string): Promise<void> => {
  await writeProjectFile(options.cwd, relative, text);

  options.onWrite?.(relative);
};

const writeArtifacts = async (
  options: PipelineOptions,
  artifacts: Artifact[],
  stage: Stage,
): Promise<void> => {
  for (const artifact of artifacts) {
    if (artifact.stage !== stage) {
      continue;
    }

    if (await applyArtifact(options.cwd, artifact, isFresh(options))) {
      options.onWrite?.(artifact.target);
    }
  }
};

const stageScaffold = async (options: PipelineOptions): Promise<void> => {
  const spec = targetFor(options.answers).scaffold(options.name, options.answers);
  const [command, ...args] = scaffoldCommand(options.answers.packageManager, spec);

  // The scaffolder creates `<name>/` itself, so this runs one directory above.
  const parent = dirname(options.cwd);

  await mkdir(parent, { recursive: true });
  await run(command, args, parent);
};

const isFresh = (options: PipelineOptions): boolean => {
  return options.fresh === true || !options.skip.includes('scaffold');
};

const stagePackage = async (
  options: PipelineOptions,
  artifacts: Artifact[],
  stage: Stage,
): Promise<void> => {
  await write(options, CONFIG_PATH, emitLintelConfig(options.answers));
  await writeArtifacts(options, artifacts, stage);

  // Rewrites the scaffolder's source to compile under the flags the tsconfig just set.
  await rewriteScaffoldedSource(options.cwd, options.answers, options.onWrite);

  // Defects in the generator's output, so they gate on fresh alone.
  if (isFresh(options)) {
    await repairScaffoldedOutput(
      options.cwd,
      options.answers,
      options.onWrite,
      options.onNotice,
    );
  }
};

// Source no scaffolder wrote; fresh output only, and never a test helper the testing answer declined.
const writeStarterFiles = async (options: PipelineOptions): Promise<void> => {
  const { starterFiles } = targetFor(options.answers);

  if (starterFiles === undefined || !isFresh(options)) {
    return;
  }

  const { answers } = options;
  const wanted = starterFiles.filter((file) => {
    return (file.library === undefined || hasLibrary(answers, file.library))
      && (file.router === undefined || answers.router === file.router)
      && (file.tests === undefined || hasTests(answers));
  });

  for (const file of wanted) {
    await write(options, file.target, await readFile(join(ASSETS_ROOT, file.source), 'utf8'));
  }
};

// Skipped when the covered file is absent: a rearranged starter costs the example, not a broken import.
const writeStarterTests = async (options: PipelineOptions): Promise<void> => {
  const { starterTests } = targetFor(options.answers);

  if (starterTests === undefined || !hasTests(options.answers) || !isFresh(options)) {
    return;
  }

  for (const test of starterTests) {
    if (await exists(join(options.cwd, test.covers))) {
      await write(options, test.target, await readFile(join(ASSETS_ROOT, test.source), 'utf8'));
    }
  }
};

// `git rev-parse`, not `existsSync('.git')`: a subdirectory of an existing repo must not get a nested one.
const ensureRepository = (options: PipelineOptions): void => {
  const inside = git(['rev-parse', '--is-inside-work-tree'], { cwd: options.cwd });

  // Said out loud: without git there are no hooks, which is a different project than promised.
  if (inside.error !== undefined) {
    options.onNotice?.(`git unavailable, skipping repository setup: ${inside.error.message}`);

    return;
  }

  if (inside.status === 0) {
    return;
  }

  const created = git(['init', '--quiet'], { cwd: options.cwd });

  options.onNotice?.(created.status === 0
    ? 'git init: the husky hooks install on the next install'
    : 'no git repository here, so the husky hooks will not install until there is one');
};

const stageStandard = async (
  options: PipelineOptions,
  artifacts: Artifact[],
  stage: Stage,
): Promise<void> => {
  ensureRepository(options);

  await writeArtifacts(options, artifacts, stage);

  // Every scaffolder's README describes a toolchain the stages above replaced; see `emitReadme`.
  const readme = await readFile(join(ASSETS_ROOT, 'readme/template.md'), 'utf8');
  await write(options, 'README.md', emitReadme(readme, options.name, options.answers));

  // Birth only: a manifest's permissions and store metadata are the project's to keep.
  if (isFresh(options)) {
    // One per packaged browser; the second is named for its browser since Chrome rejects `browser_specific_settings`
    // and AMO requires it.
    for (const browser of browsersOf(options.answers)) {
      const manifest = emitManifest(options.answers, options.name, browser);
      const target = browser === options.answers.browser
        ? 'manifest.json'
        : `manifest.${browser}.json`;

      if (manifest !== null) {
        await write(options, target, manifest);
      }
    }
  }

  await writeStarterFiles(options);
  await writeStarterTests(options);
};

// Fatal on purpose: every later step reads `node_modules`.
const stageInstall = async (options: PipelineOptions): Promise<void> => {
  options.onNotice?.(`installing with ${options.answers.packageManager}`);

  await run(options.answers.packageManager, ['install'], options.cwd);
};

const STAGE_RUNNERS: Record<Stage, StageRunner> = {
  scaffold: stageScaffold,
  lint: writeArtifacts,
  package: stagePackage,
  standard: stageStandard,
  install: stageInstall,
  fix: (options) => {
    runFixPass(options.cwd, options.answers, options.onNotice);
  },
};

export const runPipeline = async (options: PipelineOptions): Promise<void> => {
  // Read before the stages, so this is the directory as the user had it.
  const artifacts = buildArtifacts(
    options.answers,
    await readProjectShape(options.cwd),
    options.name,
  );

  for (const stage of STAGES) {
    // `--skip lint` means somebody else's rules, and fixing against those is an unasked-for edit.
    if (stage === 'fix' && options.skip.includes('lint')) {
      continue;
    }

    if (!options.skip.includes(stage)) {
      options.onStage?.(stage, STAGES.indexOf(stage) + 1, STAGES.length);
      await STAGE_RUNNERS[stage](options, artifacts, stage);
    }
  }
};
