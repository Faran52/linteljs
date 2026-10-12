import { posix, relative } from 'node:path';

import { difference, partition } from 'es-toolkit';

import { RUN_PREFIX } from '@config/constants';

import { answersCheck } from '@choices/check/answers/answersCheck';
import { drawersPick } from '@choices/pick/drawers/drawersPick';
import { catalogReader } from '@choices/read/catalog/catalogReader';
import { type Answered, type Question } from '@choices/read/manifest/manifestReader';
import { configRecord } from '@choices/record/config/configRecord';
import { answeredValues, givenValues } from '@choices/utils/drawerUtils';
import {
  filesUnder,
  readFile,
  TEMPLATES_ROOT,
} from '@disk';
import {
  atRoot,
  bannedPatternsOf,
  checkScriptOf,
  commitGateOf,
  GATE_SCRIPTS,
  gitignoreEntries,
  HOOK_DEV_DEPENDENCIES,
  huskyHooksOf,
  installScriptOf,
  lintScriptsOf,
  mergeGitignore,
  rootAnswersOf,
  SHARED_DEV_DEPENDENCIES,
  STYLE_GLOB,
  versioned,
  workspaceRootOf,
} from '@emitters';
import { FRAMEWORK_MODULES } from '@frameworks/registry';
import { projectWriter } from '@io/write/project/projectWriter';

import { WriteFailed } from '../../errors/write-failed/writeFailedError';
import { drawersMerge } from '../../merge/drawers/drawersMerge';
import {
  filesPlace,
  type PlacedFile,
  type TextFile,
} from '../../place/files/filesPlace';
import {
  drawerReader,
  type Drawn,
  type DrawnFile,
} from '../../read/drawer/drawerReader';
import { type Given, layerReader } from '../../read/layer/layerReader';
import {
  mergedShare,
  type Share,
  shareOf,
  stringOf,
  stringRecordOf,
  stringsOf,
} from '../../utils/shareUtils';
import { cssWriter } from '../../write/css/cssWriter';
import { eslintConfigWriter } from '../../write/eslint-config/eslintConfigWriter';
import { localesWriter } from '../../write/locales/localesWriter';
import { packageJsonWriter } from '../../write/package-json/packageJsonWriter';
import { routesWriter } from '../../write/routes/routesWriter';

import { FACTS } from './constants';

import type { Artifact, Host } from '@config/types';
import type { Framed, Generated } from '@frameworks/types';

type Written = Omit<Artifact, 'stage'>;

export interface AssembledProject {
  name: string;
  answers: Answered;
}

export interface Workspace {
  root: string;
  cwd: string;
  name: string;
  host: Host;
  questions: readonly Question[];
  projects: readonly [AssembledProject, ...AssembledProject[]];
}

interface Unit {
  directory: string;
  drawers: string[];
  share: Share;
  framed: Framed[];
  // The old emitters' files: the hooks, the configs and scripts they run, and a monorepo root's manifest.
  tooling: Artifact[];
  answers: Answered;
}

const gateOf = (workspace: Workspace, monorepo: boolean): Artifact[] => {
  const [first] = workspace.projects;
  const gate = [
    ...huskyHooksOf(workspace.host.packageManager, monorepo),
    ...commitGateOf(monorepo),
    ...bannedPatternsOf(first.answers.typeSafety === 'relaxed'),
  ];

  return gate;
};

const frameworkDrawersOf = async (workspace: Workspace, answers: Answered): Promise<string[]> => {
  const perTarget = answeredValues(answers, 'target')
    .map(async (target) => {
      const catalog = await catalogReader(workspace.questions, workspace.root, target);
      // An unanswered question still picks its default's drawer: a recorded config leaves `none` out.
      const filled = {
        ...answersCheck(workspace.questions, catalog, {}),
        ...answers,
      };

      return drawersPick(catalog, filled)
        .map((drawer) => {
          return `frameworks/${target}/${drawer}`;
        });
    });
  const drawers = await Promise.all(perTarget);

  return drawers.flat();
};

const framedOf = (name: string, answers: Answered, host: Host): Framed[] => {
  return answeredValues(answers, 'target')
    .flatMap((target) => {
      const module = FRAMEWORK_MODULES[target];

      if (module === undefined) {
        return [];
      }

      const framed = [module(name, answers, host)];

      return framed;
    });
};

const agentDrawersOf = (answers: Answered): string[] => {
  return answeredValues(answers, 'agents')
    .map((agent) => {
      return `common/agents/${agent}`;
    });
};

const unitsOf = async (workspace: Workspace): Promise<Unit[]> => {
  const [first] = workspace.projects;

  if (first.answers.layout !== 'monorepo') {
    const frameworkDrawers = await frameworkDrawersOf(workspace, first.answers);
    const single: Unit = {
      directory: '.',
      drawers: [...frameworkDrawers, ...agentDrawersOf(first.answers)],
      share: {
        package: {
          name: workspace.name,
          packageManager: `${workspace.host.packageManager}@${workspace.host.packageManagerVersion}`,
          scripts: lintScriptsOf(false, STYLE_GLOB),
          devDependencies: versioned(SHARED_DEV_DEPENDENCIES),
        },
      },
      framed: framedOf(first.name, first.answers, workspace.host),
      tooling: gateOf(workspace, false),
      answers: first.answers,
    };

    const units = [single];

    return units;
  }

  // Hooks and scripts run once at the git root; each project keeps its own lint-staged config.
  const [rootGate, projectGate] = partition(gateOf(workspace, true), ({ target }) => {
    return atRoot(target);
  });
  const projectUnits = workspace.projects
    .map(async ({ name, answers }) => {
      const group = answers.target === 'typescript' ? 'packages' : 'apps';
      const drawers = await frameworkDrawersOf(workspace, answers);
      // The hooks run from the root manifest.
      const devDependencies = difference(SHARED_DEV_DEPENDENCIES, HOOK_DEV_DEPENDENCIES);
      const unit: Unit = {
        directory: `${group}/${name}`,
        drawers,
        share: {
          package: {
            name,
            scripts: lintScriptsOf(true, STYLE_GLOB),
            devDependencies: versioned(devDependencies),
          },
        },
        framed: framedOf(name, answers, workspace.host),
        tooling: projectGate,
        answers,
      };

      return unit;
    });
  const root = {
    ...rootAnswersOf(workspace.host),
    packageManagerVersion: workspace.host.packageManagerVersion,
  };
  const rootUnit: Unit = {
    directory: '.',
    drawers: ['common/monorepo', ...agentDrawersOf(first.answers)],
    share: {},
    framed: [],
    // The projects carry no old answers yet, so the root reads its fields off its own.
    tooling: [...rootGate, ...workspaceRootOf(workspace.name, root, [root])],
    answers: first.answers,
  };
  const units = await Promise.all(projectUnits);

  const all = [rootUnit, ...units];

  return all;
};

// Each generated file is written only when some drawer shares its key.
const generatedOf = async (workspace: Workspace, share: Share, unit: Unit): Promise<Generated[]> => {
  const { answers } = unit;
  const { packageManager } = workspace.host;
  const run = RUN_PREFIX[packageManager];
  const packageShare = shareOf(share, 'package');
  const merged = stringRecordOf(packageShare, 'scripts');
  const gates = GATE_SCRIPTS
    .filter((gate) => {
      return Object.hasOwn(merged, gate);
    });
  // A monorepo runs husky from the root manifest.
  const install = [
    ...stringsOf(share, 'install'),
    ...answers.layout === 'monorepo' ? [] : ['husky'],
  ];
  const scripts = {
    ...merged,
    ...gates.length === 0 ? {} : { check: checkScriptOf(run, gates) },
    ...installScriptOf(packageManager, install),
  };
  const generated = unit.framed
    .map(({ record }) => {
      return record(scripts);
    });

  if (Object.hasOwn(share, 'package')) {
    const manifest = packageJsonWriter(mergedShare(packageShare, { scripts }));

    generated.push({
      path: 'package.json',
      text: manifest,
    });
  }

  if (Object.hasOwn(share, 'gitignore')) {
    const entries = gitignoreEntries(packageManager, stringsOf(share, 'gitignore'));

    generated.push({
      path: '.gitignore',
      text: mergeGitignore(null, entries),
    });
  }

  if (Object.hasOwn(share, 'eslint')) {
    const config = eslintConfigWriter(shareOf(share, 'eslint'));

    generated.push({
      path: 'eslint.config.ts',
      text: config,
    });
  }

  if (Object.hasOwn(share, 'routes')) {
    generated.push({
      path: stringOf(share, 'routesFile'),
      text: routesWriter(share),
    });
  }

  if (Object.hasOwn(share, 'css')) {
    const css = cssWriter(stringsOf(share, 'css'));

    generated.push({
      path: stringOf(share, 'cssFile'),
      text: css,
    });
  }

  if (Object.hasOwn(share, 'locales')) {
    const languages = answeredValues(answers, 'languages');
    const locales = await localesWriter(workspace.root, languages, stringsOf(share, 'locales'));
    const directory = stringOf(share, 'localesDir');

    generated.push(...locales
      .map((locale) => {
        const placed: Generated = {
          path: posix.join(directory, locale.path),
          text: locale.text,
        };

        return placed;
      }));
  }

  return generated;
};

// The layers the merged share lists, walked by every question key and every fact, which the share must set.
const layersOf = async (workspace: Workspace, unit: Unit, share: Share, withTests: boolean): Promise<Drawn[]> => {
  const layers = stringsOf(share, 'layers');

  if (layers.length === 0) {
    return [];
  }

  const questions = workspace.questions
    .map(({ key }) => {
      const entry: [string, string[]] = [key, givenValues(unit.answers, key)];

      return entry;
    });
  const facts = FACTS
    .map((fact) => {
      if (!Object.hasOwn(share, fact)) {
        const shell = answeredValues(unit.answers, 'target').join(', ');

        throw new Error(`the ${shell} shell lists layers but sets no ${fact}`);
      }

      const entry: [string, string[]] = [fact, [stringOf(share, fact)]];

      return entry;
    });
  const given: Given = Object.fromEntries([...questions, ...facts]);
  const reads = layers
    .map(async (layer) => {
      return await layerReader(workspace.root, layer, given, withTests);
    });
  const read = await Promise.all(reads);

  return read.flat();
};

const placedOf = async (files: readonly DrawnFile[], share: Share): Promise<PlacedFile[]> => {
  if (files.length === 0) {
    return [];
  }

  const reads = files
    .map(async (file) => {
      const text = await readFile(file.source, 'utf8');
      const read: TextFile = {
        ...file,
        text,
      };

      return read;
    });
  const texts = await Promise.all(reads);

  return filesPlace(texts, share);
};

const unitArtifactsOf = async (workspace: Workspace, unit: Unit): Promise<Written[]> => {
  const withTests = unit.answers.testing !== 'none';
  const reads = unit.drawers
    .map(async (drawer) => {
      return await drawerReader(workspace.root, drawer, withTests);
    });
  const own: Drawn = {
    name: unit.directory,
    files: [],
    share: unit.share,
  };
  const moduleName = `${unit.directory} framework module`;
  const framed = unit.framed
    .map(({ share }) => {
      const module: Drawn = {
        name: moduleName,
        files: [],
        share,
      };

      return module;
    });
  const drawn = await Promise.all(reads);
  const drawers = drawersMerge([
    own,
    ...framed,
    ...drawn,
  ]);
  const layers = await layersOf(workspace, unit, drawers.share, withTests);
  const layered = drawersMerge(layers);
  const share = mergedShare(drawers.share, layered.share);
  const placed = await placedOf(layered.files, share);
  const shared = await generatedOf(workspace, share, unit);
  const generated = [
    ...shared,
    ...unit.framed
      .flatMap((module) => {
        return module.files;
      }),
  ];

  const copied = [...drawers.files, ...placed]
    .map((file: PlacedFile) => {
      const artifact: Written = {
        target: posix.join(unit.directory, file.path),
        content: file.text === undefined ? { bytes: relative(TEMPLATES_ROOT, file.source) } : { text: file.text },
      };

      return artifact;
    });
  const emitted = generated
    .map((file) => {
      const artifact: Written = {
        target: posix.join(unit.directory, file.path),
        content: 'sources' in file ? { sources: file.sources } : { text: file.text },
      };

      return artifact;
    });

  const tooling = unit.tooling
    .map((artifact) => {
      const placed: Written = {
        ...artifact,
        target: posix.join(unit.directory, artifact.target),
      };

      return placed;
    });

  const artifacts = [
    ...copied,
    ...emitted,
    ...tooling,
  ];

  return artifacts;
};

// Refuses a directory with anything in it, then writes every unit's files and the recorded config once.
export const workspaceAssemble = async (workspace: Workspace): Promise<void> => {
  const present = await filesUnder(workspace.cwd);

  if (present.length > 0) {
    throw new WriteFailed(`${workspace.cwd} is not empty: nothing was written.`);
  }

  const units = await unitsOf(workspace);
  const perUnit = units
    .map(async (unit) => {
      return await unitArtifactsOf(workspace, unit);
    });
  const unitArtifacts = await Promise.all(perUnit);
  const config: Written = {
    target: 'linteljs.config.json',
    content: { text: configRecord(workspace.projects) },
  };
  const artifacts = [...unitArtifacts.flat(), config];
  const targets = new Set<string>();

  for (const { target } of artifacts) {
    if (targets.has(target)) {
      throw new Error(`${target} is written twice`);
    }

    targets.add(target);
  }

  await projectWriter(workspace.cwd, artifacts);
};
