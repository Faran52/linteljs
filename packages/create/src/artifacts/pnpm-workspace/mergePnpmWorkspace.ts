import {
  allowBuildsBlock,
  emitPnpmWorkspace,
  peerRulesBlock,
} from './emitPnpmWorkspace';

import type { Answers } from '../../model/answers/answers';

// Top-level keys whose block is dropped on merge, with why.
const SUPERSEDED_KEYS = [
  // create-next-app writes ignoredBuiltDependencies: [sharp, unrs-resolver], opting out of exactly the builds
  // lintel opts into; left in place, pnpm would refuse the install with ERR_PNPM_IGNORED_BUILDS.
  'ignoredBuiltDependencies',
];

// Line-based, not a YAML round-trip, which would reformat every line the user wrote to drop one block.
export const mergePnpmWorkspace = (existing: string | null, answers: Answers): string => {
  if (existing === null) {
    return emitPnpmWorkspace(answers);
  }

  const lines = existing.split('\n');
  const kept: string[] = [];
  let dropping = false;

  for (const line of lines) {
    const isTopLevel = line !== '' && !/^[\s-]/.test(line);

    if (isTopLevel) {
      dropping = SUPERSEDED_KEYS.some((key) => {
        return line.startsWith(`${key}:`);
      });
    }

    if (!dropping) {
      kept.push(line);
    }
  }

  const remainder = kept.join('\n').replace(/^\n+/, '');

  // Each block is decided on its own, because a project that predates one of them already has the other. Where a
  // block is already present it is the project's: leave the list alone rather than reasserting ours over it.
  const head = /^allowBuilds:/m.test(remainder) ? remainder : `${allowBuildsBlock(answers)}${remainder}`;

  // Already there is the project's, including a rule it widened by hand.
  if (/^peerDependencyRules:/m.test(head)) {
    return head;
  }

  // `trimEnd`, not a trailing-newline pattern: an anchored `\n+$` is the shape `sonarjs/super-linear-regex` reports.
  return `${head.trimEnd()}\n${peerRulesBlock(answers)}`;
};
