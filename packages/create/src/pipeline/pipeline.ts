import { dirname } from 'node:path';

import { type Stage, STAGES } from '../config/artifact';
import { type Artifact, buildArtifacts } from '../emitters';
import { seedArtifacts } from '../emitters/registry';
import { applyArtifact } from '../files/projectFiles';
import { readProjectShape } from '../files/readProjectShape';
import { mkdir } from '../files/utils/fsUtils';
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
  // Seeded first, so `linteljs.config.json` precedes the `package.json` whose dependencies its answers imply.
  const artifacts = [
    ...seedArtifacts(options.answers, options.name),
    ...buildArtifacts(options.answers, await readProjectShape(options.cwd), options.name),
  ];

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
