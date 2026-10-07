import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { STAGES } from '@config/constants';
import {
  type HostedAnswers,
  type RunOutput,
  type Stage,
} from '@config/types';

import { appDirectoryOf } from '@utils/answerUtils';

import { CONFIG_PATH, LEGACY_CONFIG_PATH } from '@answers';
import {
  artifactWriter,
  entryExists,
  projectShapeReader,
  rm,
} from '@disk';
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

    const isWritten = await artifactWriter(options.cwd, artifact, plantsSeeds(options));

    if (isWritten) {
      options.onWrite?.(artifact.target);
    }

    // Only once the current name holds the answers: until then the old one is their only copy.
    if (artifact.target === CONFIG_PATH) {
      await removeLegacyConfig(options.cwd);
    }
  }
};

const removeLegacyConfig = async (cwd: string): Promise<void> => {
  const legacyPath = join(cwd, LEGACY_CONFIG_PATH);
  const hasLegacy = await entryExists(legacyPath);

  if (hasLegacy) {
    // On a symlink this drops the link, not its target.
    await rm(legacyPath);
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

const appRoot = (options: PipelineOptions): string => {
  const directory = appDirectoryOf(options.answers, options.name);

  return join(options.cwd, directory);
};

const STAGE_RUNNERS: Record<Stage, StageRunner> = {
  lint: writeArtifacts,
  package: writeArtifacts,
  standard: stageStandard,
  install: stageInstall,
  fix: async (options) => {
    await fixPass(appRoot(options), options.answers, options.onNotice, options.cwd);
  },
};

export const pipelineRun = async (options: PipelineOptions): Promise<void> => {
  // Seeded first, so `linteljs.config.json` precedes the `package.json` its answers imply.
  const seeds = seedArtifacts(options.answers, options.name);
  const project = await projectShapeReader(appRoot(options));
  const artifacts = [
    ...seeds,
    ...buildArtifacts(options.answers, project, options.name),
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
