import {
  type Answers,
  type Artifact,
  type Workspace,
} from '@config/types';

import { WORKSPACE_GLOBS } from '../../constants';
import { merged } from '../../utils/artifactUtils';
import { flatOverrides } from '../../utils/packageJsonUtils';

import {
  allowBuildsBlock,
  overridesBlock,
  RELEASE_AGE_BLOCK,
} from './utils/emitUtils';

// create-next-app opts out of exactly the builds linteljs opts into; left in, pnpm refuses the install.
const SUPERSEDED_KEY = 'ignoredBuiltDependencies:';

const withoutSuperseded = (existing: string): string => {
  const kept: string[] = [];
  let dropping = false;

  for (const line of existing.split('\n')) {
    const isTopLevel = line !== '' && !/^[\s-]/.test(line);

    if (isTopLevel) {
      dropping = line.startsWith(SUPERSEDED_KEY);
    }

    if (!dropping) {
      kept.push(line);
    }
  }

  return kept.join('\n');
};

const keyOf = (entry: string): string => {
  return entry
    .trim()
    .replace(/^'([^']*)'.*$|^([^:]*):.*$/u, '$1$2');
};

// The union of the user's entries, kept with their values, and the ones the projects need.
const withBuilds = (remainder: string, projects: readonly Answers[]): string => {
  const block = allowBuildsBlock(projects);
  const lines = remainder.split('\n');
  const start = lines
    .findIndex((line) => {
      return line.startsWith('allowBuilds:');
    });

  if (start === -1) {
    return `${block}${remainder}`;
  }

  // The appended '' always ends the block, even in a file with no final newline.
  const stop = [...lines, '']
    .findIndex((line, index) => {
      return index > start && !/^\s+\S/u.test(line);
    });
  const own = lines.slice(start + 1, stop);
  const ownKeys = new Set(own.map(keyOf));
  const missing = block
    .split('\n')
    .slice(1, -1)
    .filter((entry) => {
      const key = keyOf(entry);

      return !ownKeys.has(key);
    });
  const entries = [...own, ...missing]
    .toSorted((left, right) => {
      const leftKey = keyOf(left);
      const rightKey = keyOf(right);

      return leftKey.localeCompare(rightKey, 'en');
    });
  const merged = [
    ...lines.slice(0, start + 1),
    ...entries,
    ...lines.slice(stop),
  ];

  return merged.join('\n');
};

// Line-based: a YAML round-trip would reformat every line the user wrote.
export const mergePnpmWorkspace = (existing: string | null, projects: readonly Answers[]): string => {
  const remainder = withoutSuperseded(existing ?? '')
    .replace(/^\n+/, '');

  const builds = withBuilds(remainder, projects);
  const hasAgePolicy = /^minimumReleaseAge:/m.test(builds);
  const withAge = hasAgePolicy ? builds : `${builds.trimEnd()}\n\n${RELEASE_AGE_BLOCK}`;
  const overrides = Object.fromEntries(projects
    .flatMap((answers) => {
      const own = flatOverrides(answers, 'pnpm');

      return Object.entries(own);
    }));
  const keepsOverrides = Object.keys(overrides).length === 0 || /^overrides:/m.test(withAge);
  const withOverrides = keepsOverrides ? withAge : `${withAge.trimEnd()}\n\n${overridesBlock(overrides)}`;

  const packagesBlock = `packages:\n${WORKSPACE_GLOBS
    .map((glob) => {
      return `  - '${glob}'\n`;
    })
    .join('')}\n`;
  const listsPackages = projects
    .every((answers) => {
      return answers.layout === 'single';
    }) || /^packages:/m.test(withOverrides);
  const withPackages = listsPackages ? withOverrides : `${packagesBlock}${withOverrides}`;

  // `trimEnd`: an anchored `\n+$` is the shape `sonarjs/super-linear-regex` reports.
  return `${withPackages.trimEnd()}\n`;
};

// Discarding it breaks an install that already wrote into it.
export const pnpmWorkspaceEmitter = (workspace: Workspace): Artifact[] => {
  const projects = workspace.projects
    .map(({ answers }) => {
      return answers;
    });
  const artifacts: Artifact[] = workspace.projects[0].answers.packageManager === 'pnpm'
    ? [merged('package', 'pnpm-workspace.yaml', (current) => {
        return mergePnpmWorkspace(current, projects);
      })]
    : [];

  return artifacts;
};
