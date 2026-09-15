import { emitPackageJson, parsePackageJson } from './emitPackageJson';

import type { Answers } from '../../model/answers/answers';

// Reached through the artifact list so `sync` runs it too; `name` is consulted only when there is no `package.json`.
export const mergePackageJson = (current: string | null, answers: Answers, name: string): string => {
  return emitPackageJson(current === null ? { name } : parsePackageJson(current), answers);
};
