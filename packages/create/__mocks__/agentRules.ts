import {
  type Agent,
  type Answers,
  DEFAULT_ANSWERS,
} from '@answers';

import type { Artifact } from '@config/types';

// The `claude-rules/` source every agent is fed, frontmatter and all.
export const RULE
  = '---\npaths:\n  - "src/**/*.{ts,tsx}"\n  - "tsconfig.json"\n---\n\n# Repository Structure\n\nBody.\n';

// Three shipped rules carry no `paths:` list, because they govern any file rather than a set of them.
export const UNSCOPED = 'No frontmatter here.\n';

export const answersFor = (agents: Agent[]): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    agents,
  };
};

export const targets = (artifacts: Artifact[]): string[] => {
  return artifacts.map((artifact) => {
    return artifact.target;
  });
};

export const transformOf = (
  artifacts: Artifact[],
  target: string,
): ((source: string, current: string | null) => string) => {
  const found = artifacts.find((artifact) => {
    return artifact.target === target;
  });

  if (found === undefined || !('sources' in found.content) || found.content.transform === undefined) {
    throw new Error(`no transform for ${target}`);
  }

  return found.content.transform;
};
