import { performance } from 'node:perf_hooks';

import { MANAGER_BINARIES, STAGES } from '@config/constants';
import { type RunOutput, type Stage } from '@config/types';

import { artifactWriter, projectShapeReader } from '@disk';
import {
  type Artifact,
  buildArtifacts,
  seedArtifacts,
} from '@emitters';
import { gitSpawn, runSpawn } from '@spawns';

import { fixPass } from '../../passes/fix/fixPass';

import type { HostedAnswers } from '@answers';

export interface PipelineOptions {
  name: string;
  cwd: string;
  answers: HostedAnswers;
  skip: Stage[];
  // The directory is a repository that already exists rather than one this run made.
  existing?: boolean;
  // Plant the seed artifacts in an existing directory, as if this run had made it.
  seed?: boolean;
  onWrite?: (path: string) => void;
  // What happened that was not a file write.
  onNotice?: (message: string) => void;
  // Called as each stage starts, with its position in the full list.
  onStage?: (stage: Stage, index: number, count: number) => void;
  // Called once the stage's runner resolves, with what it took.
  onStageDone?: (stage: Stage, milliseconds: number) => void;
  // What the install and the fix pass do with their own output. `terminal/` decides; a pipe keeps them visible.
  output?: RunOutput;
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

    if (await artifactWriter(options.cwd, artifact, plantsSeeds(options))) {
      options.onWrite?.(artifact.target);
    }
  }
};

// A project is born once: `create` makes the directory, and `--existing --seed` asks for the same in one that exists.
const plantsSeeds = (options: PipelineOptions): boolean => {
  return options.seed === true || options.existing !== true;
};

// `git rev-parse`, not `existsSync('.git')`: a subdirectory of an existing repo must not get a nested one.
const ensureRepository = (options: PipelineOptions): void => {
  const inside = gitSpawn(['rev-parse', '--is-inside-work-tree'], { cwd: options.cwd });

  // Said out loud: without git there are no hooks, which is a different project than promised.
  if (inside.error !== undefined) {
    options.onNotice?.(`git unavailable, skipping repository setup: ${inside.error.message}`);

    return;
  }

  if (inside.status === 0) {
    return;
  }

  const created = gitSpawn(['init', '--quiet'], { cwd: options.cwd });

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
  // The command it runs rather than the id: `yarn-classic` is not something anyone can type.
  const binary = MANAGER_BINARIES[options.answers.packageManager];

  options.onNotice?.(`installing with ${binary}`);

  await runSpawn(binary, ['install'], options.cwd, options.output);
};

const STAGE_RUNNERS: Record<Stage, StageRunner> = {
  lint: writeArtifacts,
  package: writeArtifacts,
  standard: stageStandard,
  install: stageInstall,
  fix: async (options) => {
    await fixPass(options.cwd, options.answers, options.onNotice);
  },
};

export const pipelineRun = async (options: PipelineOptions): Promise<void> => {
  // Read before the stages, so this is the directory as the user had it.
  // Seeded first, so `linteljs.config.json` precedes the `package.json` whose dependencies its answers imply.
  const artifacts = [
    ...seedArtifacts(options.answers, options.name),
    ...buildArtifacts(options.answers, await projectShapeReader(options.cwd), options.name),
  ];

  for (const stage of STAGES) {
    // `--skip lint` means somebody else's rules, and fixing against those is an unasked-for edit.
    if (stage === 'fix' && options.skip.includes('lint')) {
      continue;
    }

    if (!options.skip.includes(stage)) {
      options.onStage?.(stage, STAGES.indexOf(stage) + 1, STAGES.length);

      const started = performance.now();

      await STAGE_RUNNERS[stage](options, artifacts, stage);
      options.onStageDone?.(stage, performance.now() - started);
    }
  }
};
