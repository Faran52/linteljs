import { performance } from 'node:perf_hooks';

import { STAGES } from '@config/constants';
import {
  type HostedAnswers,
  type RunOutput,
  type Stage,
} from '@config/types';

import { artifactWriter, projectShapeReader } from '@disk';
import {
  type Artifact,
  buildArtifacts,
  seedArtifacts,
} from '@emitters';
import { gitSpawn, runSpawn } from '@spawns';

import { fixPass } from '../../passes/fix/fixPass';

export interface PipelineOptions {
  name: string;
  cwd: string;
  answers: HostedAnswers;
  skip: Stage[];
  existing?: boolean;
  seed?: boolean;
  onWrite?: (path: string) => void;
  onNotice?: (message: string) => void;
  onStage?: (stage: Stage, index: number, count: number) => void;
  onStageDone?: (stage: Stage, milliseconds: number) => void;
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

const plantsSeeds = (options: PipelineOptions): boolean => {
  return options.seed === true || options.existing !== true;
};

// Not `existsSync('.git')`: a subdirectory of an existing repo must not get a nested one.
const ensureRepository = (options: PipelineOptions): void => {
  const inside = gitSpawn(['rev-parse', '--is-inside-work-tree'], { cwd: options.cwd });

  // Said out loud: without git there are no hooks.
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
  const binary = options.answers.packageManager;

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
  // Seeded first, so `linteljs.config.json` precedes the `package.json` its answers imply.
  const artifacts = [
    ...seedArtifacts(options.answers, options.name),
    ...buildArtifacts(options.answers, await projectShapeReader(options.cwd), options.name),
  ];

  for (const [index, stage] of STAGES.entries()) {
    // `--skip lint` means somebody else's rules, and fixing against those is an unasked-for edit.
    if (stage === 'fix' && options.skip.includes('lint')) {
      continue;
    }

    if (!options.skip.includes(stage)) {
      options.onStage?.(stage, index + 1, STAGES.length);

      const started = performance.now();

      await STAGE_RUNNERS[stage](options, artifacts, stage);
      options.onStageDone?.(stage, performance.now() - started);
    }
  }
};
