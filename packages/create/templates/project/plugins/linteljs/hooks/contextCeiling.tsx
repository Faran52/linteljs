// Holds each subagent under the context ceiling, and tells the user when the main session passes it.
import {
  atom,
  type EngineInterface,
  type On,
  type PluginOptions,
  read,
  type ToolCallInput,
  type ToolCallResult,
  type TurnUsage,
  update,
} from 'claude-code';

import { TOKENS_PER_K } from './constants.ts';

import type { ContextReading } from '../types/index.d.ts';

interface Limits {
  warn: number;
  ceiling: number;
  wrapUpCalls: number;
}

// The main loop carries no agent id.
const MAIN = 'main';

const UNREAD: ContextReading = {
  tokens: 0,
  isPastWarn: false,
  isPastCeiling: false,
  wrapUpCalls: 0,
};

const FAILED = 'The context ceiling guard failed, so this call is refused. Return your report.';

// The engine fills each manifest default and holds a number field to a number.
const limitOf = (options: PluginOptions, key: string): number => {
  const value = options[key];

  if (typeof value !== 'number') {
    throw new TypeError(`${key} is not a number`);
  }

  return value;
};

// A project's settings env overrides the options, which Claude Code reads from user settings alone.
const tokensOf = (value: string | undefined, fallback: number): number => {
  const tokens = Number(value);

  return Number.isInteger(tokens) && tokens > 0 ? tokens : fallback;
};

const limitsIn = async ($: EngineInterface, options: Limits): Promise<Limits> => {
  const warn = await $.env.get('CONTEXT_WARN_TOKENS');
  const ceiling = await $.env.get('CONTEXT_CEILING_TOKENS');
  const limits = {
    warn: tokensOf(warn, options.warn),
    ceiling: tokensOf(ceiling, options.ceiling),
    wrapUpCalls: options.wrapUpCalls,
  };

  return limits;
};

export const limitsOf = (options: PluginOptions): Limits => {
  const limits = {
    warn: limitOf(options, 'context_warn_tokens'),
    ceiling: limitOf(options, 'context_ceiling_tokens'),
    wrapUpCalls: limitOf(options, 'context_wrap_up_calls'),
  };

  return limits;
};

const callsOf = (count: number): string => {
  return count === 1 ? '1 tool call' : `${String(count)} tool calls`;
};

// What the call that ran past the ceiling tells the agent, with `left` calls to go after it.
const wrapUpOf = (size: string, ceiling: string, left: number): string => {
  if (left === 0) {
    return `Context is ${size}, past the ${ceiling} ceiling, and that was your last tool call: return your report.`;
  }

  return `Context is ${size}, past the ${ceiling} ceiling. ${callsOf(left)} left, only to commit work that passes `
    + 'the check and update your resume note; then every call is refused. Start no new work.';
};

// What the user is told becomes of a subagent that passed the ceiling.
const thenOf = (wrapUpCalls: number): string => {
  if (wrapUpCalls === 0) {
    return 'its tool calls are refused';
  }

  return `it has ${callsOf(wrapUpCalls)} to wrap up, then its tool calls are refused`;
};

const sizeOf = (tokens: number): string => {
  const thousands = Math.floor(tokens / TOKENS_PER_K);

  return `${String(thousands)}K`;
};

// The prompt a step sent: fresh input plus what the cache read and wrote.
const promptOf = (usage: TurnUsage): number => {
  return usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens;
};

const withContext = (result: ToolCallResult, text: string): ToolCallResult => {
  if (result.deny !== undefined) {
    return result;
  }

  const context = result.context === undefined ? [text] : [...result.context, text];

  const added = {
    ...result,
    context,
  };

  return added;
};

const descriptionOf = async ($: EngineInterface, agentId: string): Promise<string> => {
  const agents = await $.agent.list();
  const agent = agents
    .find((listed) => {
      return listed.id === agentId;
    });

  return agent?.description ?? agentId;
};

const judge = async (
  $: EngineInterface,
  e: ToolCallInput,
  next: (input: ToolCallInput) => Promise<ToolCallResult>,
  options: Limits,
): Promise<ToolCallResult> => {
  const limits = await limitsIn($, options);
  const loop = atom({
    plugin: 'linteljs',
    key: 'context',
    id: e.agentId ?? MAIN,
  }, UNREAD);
  const reading = await read($, loop);
  const isPastWarn = reading.tokens >= limits.warn;
  const isPastCeiling = reading.tokens >= limits.ceiling;
  const size = sizeOf(reading.tokens);
  const ceiling = sizeOf(limits.ceiling);
  // Dropping back under the ceiling resets the count.
  const spent = isPastCeiling ? reading.wrapUpCalls : 0;
  const isWrapUp = e.agentId !== undefined && isPastCeiling && spent < limits.wrapUpCalls;

  await update($, loop, (current) => {
    const seen = {
      ...current,
      isPastWarn,
      isPastCeiling,
      wrapUpCalls: isWrapUp ? spent + 1 : spent,
    };

    return seen;
  });

  const isFirstPastCeiling = isPastCeiling && !reading.isPastCeiling;

  if (e.agentId !== undefined && isPastCeiling) {
    if (isFirstPastCeiling) {
      const description = await descriptionOf($, e.agentId);
      $.ui.toast(`Subagent ${description} passed ${ceiling} (${size}); ${thenOf(limits.wrapUpCalls)}.`);
    }

    if (!isWrapUp) {
      const refused = {
        deny: `Context is ${size}, past the ${ceiling} ceiling, and no tool calls are left, so this call is refused. `
          + 'Return your report.',
      };

      return refused;
    }

    const wrapped = await next(e);
    const left = wrapUpOf(size, ceiling, limits.wrapUpCalls - spent - 1);

    return withContext(wrapped, left);
  }

  const ran = await next(e);

  if (e.agentId !== undefined && isPastWarn && !reading.isPastWarn) {
    const warning = `Context is ${size} of a ${ceiling} ceiling. Finish the current step, commit work that passes `
      + 'the check, update your resume note and return your report.';

    return withContext(ran, warning);
  }

  if (e.agentId === undefined && isFirstPastCeiling) {
    $.ui.toast(`Context passed ${ceiling} (${size}). Consider /compact or a fresh session.`);

    const told = `Context is ${size}, past ${ceiling}. Tell the user so in one line, and keep replies lean.`;

    return withContext(ran, told);
  }

  return ran;
};

export const registerContextCeiling = (on: On, options: PluginOptions): void => {
  const limits = limitsOf(options);

  on('turn.step', async function* ($, e, next) {
    const response = yield* next(e);
    const { usage } = response;

    if (usage !== null) {
      const loop = atom({
        plugin: 'linteljs',
        key: 'context',
        id: e.agentId ?? MAIN,
      }, UNREAD);

      await update($, loop, (current) => {
        const measured = {
          ...current,
          tokens: promptOf(usage),
        };

        return measured;
      });
    }

    return response;
  });

  on('tool.call', ($, e, next) => {
    return judge($, e, next, limits);
  })
    .catch(($, e, next) => {
      const failed = { deny: FAILED };

      return next.called ? next(e) : failed;
    });
};
