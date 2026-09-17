import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { env } from 'node:process';

import { type Artifact, buildArtifacts } from '../../artifacts';
import { emitManifest } from '../../artifacts/manifest/emitManifest';
import { emitReadme } from '../../artifacts/readme/emitReadme';
import {
  browsersOf,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { CONFIG_PATH, emitLintelConfig } from '../../model/config/lintelConfig';
import { type Stage, STAGES } from '../../model/stages/stages';
import {
  type ScaffoldKind,
  type ScaffoldSpec,
  targetFor,
} from '../../model/targets';
import { runFixPass } from '../fix-pass/fixPass';
import { git } from '../git/git';
import { applyArtifact, writeProjectFile } from '../project-files/projectFiles';
import { readProjectShape } from '../project-shape/readProjectShape';
import { repairScaffoldedOutput } from '../repair/repair';
import { rewriteScaffoldedSource } from '../rewrite/rewrite';
import { ASSETS_ROOT } from '../shipped-assets/shippedAssets';
import { exists } from '../utils/fsUtils';

import type { Answers, PackageManager } from '../../model/answers/answers';

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

// A tuple, so the first element is a command with no `undefined` guard.
type CommandLine = [string, ...string[]];

type StageRunner = (
  options: PipelineOptions,
  artifacts: Artifact[],
  stage: Stage,
) => Promise<void> | void;

// Four spellings of the same intent; wrong, it reads as installing a package called `vite my-app`.
const SCAFFOLD_COMMANDS: Record<PackageManager, Record<ScaffoldKind, CommandLine>> = {
  pnpm: {
    create: ['pnpm', 'create'],
    dlx: ['pnpm', 'dlx'],
  },
  npm: {
    create: ['npm', 'create'],
    dlx: ['npx', '--yes'],
  },
  yarn: {
    create: ['yarn', 'create'],
    dlx: ['yarn', 'dlx'],
  },
  bun: {
    create: ['bun', 'create'],
    dlx: ['bunx'],
  },
};

const run = async (command: string, args: string[], cwd: string): Promise<void> => {
  await new Promise<void>((settle, fail) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      // Angular's CLI otherwise prompts for analytics with no flag to decline.
      env: {
        ...env,
        NG_CLI_ANALYTICS: 'false',
      },
    });

    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) {
        settle();
        return;
      }

      fail(new Error(`${command} ${args.join(' ')} exited with ${String(code)}`));
    });
  });
};

export const scaffoldCommand = (
  packageManager: PackageManager,
  spec: ScaffoldSpec,
): CommandLine => {
  const [scaffolder, name, ...flags] = spec.args;
  const launcher = spec.via ?? packageManager;
  // `npm create` keeps the flags for itself unless `--` follows the project name.
  const separator = launcher === 'npm' && spec.kind === 'create' ? ['--'] : [];

  return [...SCAFFOLD_COMMANDS[launcher][spec.kind], scaffolder, name, ...separator, ...flags];
};

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

// Source no scaffolder wrote; fresh output only, whatever the testing answer.
const writeStarterFiles = async (options: PipelineOptions): Promise<void> => {
  const { starterFiles } = targetFor(options.answers);

  if (starterFiles === undefined || !isFresh(options)) {
    return;
  }

  const { answers } = options;
  const wanted = starterFiles.filter((file) => {
    return (file.library === undefined || hasLibrary(answers, file.library))
      && (file.router === undefined || answers.router === file.router);
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
