// The band above the prompt: what the commit gate would say about the work tree now.
import {
  atom,
  type EngineInterface,
  type On,
  read,
  type Register,
  update,
} from 'claude-code';

import type { CheckWord } from '../types/index.d.ts';

const check = atom({
  plugin: 'linteljs',
  key: 'check',
} as const, null);

// Each state's glyph and its colour.
export const MARKS: Record<CheckWord, [string, string]> = {
  passed: ['✓', 'green'],
  stale: ['◐', 'yellow'],
  failed: ['✗', 'red'],
  running: ['◐', 'yellow'],
  none: ['○', 'gray'],
};

const isWord = (text: string): text is CheckWord => {
  return Object.hasOwn(MARKS, text);
};

// Outside a git project with a `check` script the script prints nothing, and the band stays away.
const printed = async ($: EngineInterface, cwd: string): Promise<string> => {
  try {
    const status = await $.process.run(['node', `${$.plugin.root}/hooks/checkStatusHook.ts`], { cwd });

    return status.stdout.trim();
  }
  catch {
    return '';
  }
};

const refresh = async ($: EngineInterface): Promise<void> => {
  const cwd = await $.session.root();
  const text = await printed($, cwd);

  await update($, check, () => {
    return isWord(text) ? text : null;
  });
};

export const registerCheckRefresh = (on: On): void => {
  on('session.start', async ($, e, next) => {
    const started = await next(e);
    await refresh($);

    return started;
  });

  on('turn.complete', async ($, e, next) => {
    const completed = await next(e);

    if (e.agentId === undefined) {
      await refresh($);
    }

    return completed;
  });
};

export const register: Register = (on) => {
  registerCheckRefresh(on);

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const word = await read($, check);

    if (e.props.hasSurvey || word === null) {
      return next(e);
    }

    const { Box, Text } = $.ui.resolve(e);
    const [glyph, color] = MARKS[word];
    const below = await next(e);

    return (
      <Box flexDirection="column">
        <Text>
          <Text color={color}>{glyph}</Text>
          {` check ${word}`}
        </Text>
        {below}
      </Box>
    );
  });
};
