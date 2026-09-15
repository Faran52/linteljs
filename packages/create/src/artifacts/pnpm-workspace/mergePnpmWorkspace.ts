import {
  allowBuildsBlock,
  emitPnpmWorkspace,
  peerRulesBlock,
} from './emitPnpmWorkspace';

import type { Answers } from '../../model/answers/answers';

const SUPERSEDED_KEYS = [
  // create-next-app opts out of exactly the builds lintel opts into; left in, pnpm refuses the install.
  'ignoredBuiltDependencies',
];

// Line-based: a YAML round-trip would reformat every line the user wrote.
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

  // Each block on its own, since a project that predates one already has the other; a present block is the project's.
  const head = /^allowBuilds:/m.test(remainder) ? remainder : `${allowBuildsBlock(answers)}${remainder}`;

  if (/^peerDependencyRules:/m.test(head)) {
    return head;
  }

  // `trimEnd`: an anchored `\n+$` is the shape `sonarjs/super-linear-regex` reports.
  return `${head.trimEnd()}\n${peerRulesBlock(answers)}`;
};
