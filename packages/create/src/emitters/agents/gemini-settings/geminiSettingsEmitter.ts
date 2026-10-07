import { type Answers, type Artifact } from '@config/types';

import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { merged } from '../../utils/artifactUtils';
import { withOurHooks } from '../utils/hookUtils';

interface GeminiCommand {
  type: 'command';
  command: string;
}

interface GeminiHook {
  matcher: string;
  hooks: [GeminiCommand];
}

const HOOKS_DIRECTORY = 'plugins/linteljs/hooks/';

const hook = (name: string, matcher: string): GeminiHook => {
  const entry: GeminiHook = {
    matcher,
    hooks: [{
      type: 'command',
      command: `node "$GEMINI_PROJECT_DIR/${HOOKS_DIRECTORY}${name}Hook.ts"`,
    }],
  };

  return entry;
};

// No commit gate: Gemini CLI's AfterTool payload documents no exit status to record a check by.
export const GEMINI_HOOKS: Record<string, GeminiHook[]> = {
  BeforeTool: [
    hook('gitSafetyGuard', 'run_shell_command'),
    hook('generatedFileGuard', 'write_file|replace'),
  ],
  AfterTool: [
    hook('eslintFixWarning', 'run_shell_command'),
    hook('bannedPatternGuard', 'write_file|replace'),
  ],
};

const isOurs = (entry: object): boolean => {
  return JSON.stringify(entry).includes(HOOKS_DIRECTORY);
};

// Every entry this CLI wrote taken out, so a sync writes its current ones exactly once.
const mergedHooks = (theirs: object): object => {
  const kept = Object.entries(theirs)
    .map(([event, list]) => {
      const entries = Array.isArray(list)
        ? list
            .filter(isJsonObject)
            .filter((entry) => {
              return !isOurs(entry);
            })
        : [];

      const pair: [string, object[]] = [event, entries];

      return pair;
    });

  return withOurHooks(kept, GEMINI_HOOKS);
};

const mergedContext = (theirs: object): object => {
  const named = 'fileName' in theirs ? theirs.fileName : undefined;
  const names = [named]
    .flat()
    .filter((name) => {
      return typeof name === 'string';
    });

  // GEMINI.md stays listed, so a project's own still loads beside AGENTS.md.
  const fileName = new Set([
    'AGENTS.md',
    'GEMINI.md',
    ...names,
  ]);
  const context = {
    ...theirs,
    fileName: [...fileName],
  };

  return context;
};

export const mergeGeminiSettings = (current: string | null): string => {
  const settings = parsedAs(current, isJsonObject) ?? {};
  const context = 'context' in settings && isJsonObject(settings.context) ? settings.context : {};
  const hooks = 'hooks' in settings && isJsonObject(settings.hooks) ? settings.hooks : {};

  return `${JSON.stringify({
    ...settings,
    context: mergedContext(context),
    hooks: mergedHooks(hooks),
  }, null, 2)}\n`;
};

export const geminiSettingsEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('gemini-cli')) {
    return [];
  }

  const artifacts = [merged('standard', '.gemini/settings.json', mergeGeminiSettings)];

  return artifacts;
};
