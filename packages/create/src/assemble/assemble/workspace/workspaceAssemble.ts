import { posix, relative } from 'node:path';

import { drawersPick } from '@choices/pick/drawers/drawersPick';
import { catalogReader } from '@choices/read/catalog/catalogReader';
import { type Answered, type Question } from '@choices/read/manifest/manifestReader';
import { configRecord } from '@choices/record/config/configRecord';
import { answeredValues } from '@choices/utils/drawerUtils';
import { filesUnder, TEMPLATES_ROOT } from '@disk';
import {
  gitignoreEntries,
  installScriptOf,
  mergeGitignore,
} from '@emitters';
import { FRAMEWORK_MODULES } from '@frameworks/registry';
import { projectWriter } from '@io/write/project/projectWriter';

import { WriteFailed } from '../../errors/write-failed/writeFailedError';
import { drawersMerge } from '../../merge/drawers/drawersMerge';
import { drawerReader, type Drawn } from '../../read/drawer/drawerReader';
import {
  mergedShare,
  type Share,
  shareOf,
  stringOf,
  stringsOf,
} from '../../utils/shareUtils';
import { cssWriter } from '../../write/css/cssWriter';
import { eslintConfigWriter } from '../../write/eslint-config/eslintConfigWriter';
import { localesWriter } from '../../write/locales/localesWriter';
import { packageJsonWriter } from '../../write/package-json/packageJsonWriter';
import { routesWriter } from '../../write/routes/routesWriter';

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
  answers: Answered;
}

const frameworkDrawersOf = async (workspace: Workspace, answers: Answered): Promise<string[]> => {
  const perTarget = answeredValues(answers, 'target')
    .map(async (target) => {
      const catalog = await catalogReader(workspace.questions, workspace.root, target);

      return drawersPick(catalog, answers)
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
  const rootShare: Share = {
    package: {
      name: workspace.name,
      packageManager: `${workspace.host.packageManager}@${workspace.host.packageManagerVersion}`,
    },
  };

  if (first.answers.layout !== 'monorepo') {
    const frameworkDrawers = await frameworkDrawersOf(workspace, first.answers);
    const single: Unit = {
      directory: '.',
      drawers: [...frameworkDrawers, ...agentDrawersOf(first.answers)],
      share: rootShare,
      framed: framedOf(first.name, first.answers, workspace.host),
      answers: first.answers,
    };

    const units = [single];

    return units;
  }

  const projectUnits = workspace.projects
    .map(async ({ name, answers }) => {
      const group = answers.target === 'typescript' ? 'packages' : 'apps';
      const drawers = await frameworkDrawersOf(workspace, answers);
      const unit: Unit = {
        directory: `${group}/${name}`,
        drawers,
        share: { package: { name } },
        framed: framedOf(name, answers, workspace.host),
        answers,
      };

      return unit;
    });
  const rootUnit: Unit = {
    directory: '.',
    drawers: ['common/monorepo', ...agentDrawersOf(first.answers)],
    share: rootShare,
    framed: [],
    answers: first.answers,
  };
  const units = await Promise.all(projectUnits);

  const all = [rootUnit, ...units];

  return all;
};

// Each generated file is written only when some drawer shares its key.
const generatedOf = async (workspace: Workspace, share: Share, answers: Answered): Promise<Generated[]> => {
  const { packageManager } = workspace.host;
  // A monorepo runs husky from the root manifest.
  const install = [
    ...stringsOf(share, 'install'),
    ...answers.layout === 'monorepo' ? [] : ['husky'],
  ];
  const scripts = installScriptOf(packageManager, install);
  const manifestShare = mergedShare(shareOf(share, 'package'), { scripts });
  const manifest = packageJsonWriter(manifestShare);
  const generated: Generated[] = [{
    path: 'package.json',
    text: manifest,
  }];

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
  const { files, share } = drawersMerge([
    own,
    ...framed,
    ...drawn,
  ]);
  const shared = await generatedOf(workspace, share, unit.answers);
  const generated = [
    ...shared,
    ...unit.framed
      .flatMap((module) => {
        return module.files;
      }),
  ];

  const copied = files
    .map((file) => {
      const artifact: Written = {
        target: posix.join(unit.directory, file.path),
        content: { bytes: relative(TEMPLATES_ROOT, file.source) },
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

  const artifacts = [...copied, ...emitted];

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
