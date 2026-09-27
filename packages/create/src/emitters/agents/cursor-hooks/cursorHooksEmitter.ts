import { type Answers, type Artifact } from '@config/types';

import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { merged } from '../../utils/artifactUtils';

type HookList = [string, object[]];

const HOOKS_DIRECTORY = 'plugins/linteljs/hooks/';

/**
 * Project hooks run from the project root, so the path is fixed. The git guard sits on the shell gate and the eslint
 * warning on `postToolUse`, the one event that hands the agent added context: Cursor also runs Claude Code's hooks,
 * as `preToolUse` and `postToolUse` on `Write`, and each hook answers under Cursor only on the event given here, so
 * that copy stays silent. The banned-pattern guard is absent: Cursor documents no file path on the edit event that
 * can answer the agent.
 */
export const CURSOR_HOOKS: Record<string, object[]> = {
  beforeShellExecution: [{ command: `node ${HOOKS_DIRECTORY}gitSafetyGuardHook.ts` }],
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

// A project's own hooks, with every entry this CLI wrote taken out so a sync writes its current ones exactly once. An
// entry that is not a hook is dropped rather than its whole event.
const hooksOf = (entry: [string, unknown]): HookList => {
  const [event, list] = entry;
  const hooks = Array.isArray(list) ? list.filter(isJsonObject) : [];

  return [event, hooks.filter((hook) => {
    return !isOurs(hook);
  })];
};

const theirHooks = (text: string | null): HookList[] => {
  const parsed = parsedAs(text, isJsonObject);
  const hooks = parsed !== null && 'hooks' in parsed ? parsed.hooks : undefined;

  return isJsonObject(hooks) ? Object.entries(hooks).map(hooksOf) : [];
};

export const mergeCursorHooks = (current: string | null): string => {
  const hooks = new Map(theirHooks(current));

  for (const [event, ours] of Object.entries(CURSOR_HOOKS)) {
    hooks.set(event, [...hooks.get(event) ?? [], ...ours]);
  }

  const kept = [...hooks].filter(([, list]) => {
    return list.length > 0;
  });

  return `${JSON.stringify({
    version: 1,
    hooks: Object.fromEntries(kept),
  }, null, 2)}\n`;
};

// A merge, so a project's own Cursor hooks survive a sync; removable, since the file exists because Cursor was chosen.
export const cursorHooksEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('cursor')) {
    return [];
  }

  return [
    {
      ...merged('standard', '.cursor/hooks.json', mergeCursorHooks),
      removable: true,
    },
  ];
};
