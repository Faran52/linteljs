import { type Answers, type Artifact } from '@config/types';

import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { merged } from '../../utils/artifactUtils';

type HookList = [string, object[]];

const HOOKS_DIRECTORY = 'plugins/linteljs/hooks/';

/**
 * Cursor also runs Claude Code's hooks, which answer under Cursor only on the event given here.
 * No banned-pattern or generated-file guard: Cursor documents no file path on the edit event that can
 * answer the agent. No commit gate: its afterShellExecution carries no exit status to record a check by.
 */
export const CURSOR_HOOKS: Record<string, object[]> = {
  beforeShellExecution: [
    { command: `node ${HOOKS_DIRECTORY}gitSafetyGuardHook.ts` },
    { command: `node ${HOOKS_DIRECTORY}dependencyAskHook.ts` },
  ],
  postToolUse: [
    {
      command: `node ${HOOKS_DIRECTORY}eslintFixWarningHook.ts`,
      matcher: 'Shell',
    },
  ],
};

const isOurs = (hook: object): boolean => {
  return 'command' in hook && typeof hook.command === 'string' && hook.command.includes(HOOKS_DIRECTORY);
};

// Every entry this CLI wrote taken out, so a sync writes its current ones exactly once.
const hooksOf = (entry: [string, unknown]): HookList => {
  const [event, list] = entry;
  const hooks = Array.isArray(list) ? list.filter(isJsonObject) : [];

  const theirs: HookList = [event, hooks
    .filter((hook) => {
      return !isOurs(hook);
    })];

  return theirs;
};

const theirHooks = (text: string | null): HookList[] => {
  const parsed = parsedAs(text, isJsonObject);
  const hooks = parsed !== null && 'hooks' in parsed ? parsed.hooks : undefined;

  return isJsonObject(hooks)
    ? Object.entries(hooks)
        .map(hooksOf)
    : [];
};

export const mergeCursorHooks = (current: string | null): string => {
  const hooks = new Map(theirHooks(current));

  for (const [event, ours] of Object.entries(CURSOR_HOOKS)) {
    hooks.set(event, [...hooks.get(event) ?? [], ...ours]);
  }

  const kept = [...hooks]
    .filter(([, list]) => {
      return list.length > 0;
    });

  return `${JSON.stringify({
    version: 1,
    hooks: Object.fromEntries(kept),
  }, null, 2)}\n`;
};

export const cursorHooksEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('cursor')) {
    return [];
  }

  const artifacts: Artifact[] = [merged('standard', '.cursor/hooks.json', mergeCursorHooks)];

  return artifacts;
};
