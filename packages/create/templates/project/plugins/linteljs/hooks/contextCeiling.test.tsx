import {
  type Engine,
  expect,
  mock,
  test,
} from 'claude-code/testing';

import type {
  AgentInfo,
  On,
  ToolCallResult,
  TurnStepChunk,
  TurnStepResult,
} from 'claude-code';

interface World {
  // The prompt size the next model request reports; null for a request that got no usage.
  prompt: number | null;
  toasts: string[];
  ran: number;
  failing?: 'agent.list' | 'ui.toast';
  // What the tool answers; a plain run when not given.
  answer?: ToolCallResult;
}

const LIMITS = {
  options: {
    context_warn_tokens: 1000,
    context_ceiling_tokens: 2000,
  },
};

const AGENT = 'agent-1';

const AGENT_INFO: AgentInfo = {
  id: AGENT,
  description: 'Port the ceiling',
  type: 'general-purpose',
  status: 'running',
  kind: 'local_agent',
  taskStatus: 'running',
  label: 'Port the ceiling',
  startTime: 0,
  cwd: '/project',
  tokenCount: 0,
  tokenSamples: [],
  hasRow: true,
};

const WARNING = 'Context is 1K of a 2K ceiling. Finish the current step, commit work that passes the check, update '
  + 'your resume note and return your report.';

const REFUSAL = 'Context is 2K, past the 2K ceiling, so this call is refused. Commit only work that passes the '
  + 'check, update your resume note and return your report. Start no new work.';

const usageOf = (tokens: number): TurnStepResult['usage'] => {
  const third = Math.floor(tokens / 3);
  const usage = {
    input_tokens: tokens - (2 * third),
    output_tokens: 7,
    cache_read_input_tokens: third,
    cache_creation_input_tokens: third,
    model: 'claude-opus-5-5',
  };

  return usage;
};

// The model, the tools, the agent list, the toasts and an env that sets no limit beneath the plugin; each tool call
// that reaches them counts.
const fakeWorld = (on: On, env: Readonly<Record<string, string>> = {}): World => {
  mock.env(on, env);

  const world: World = {
    prompt: 0,
    toasts: [],
    ran: 0,
  };

  on('turn.step', async function* (_, e) {
    const text: TurnStepChunk = {
      kind: 'text',
      index: 0,
      text: 'thinking aloud',
    };
    // A model's chunks arrive as it streams them.
    const chunk = await Promise.resolve(text);

    yield chunk;

    const usage = world.prompt === null ? null : usageOf(world.prompt);
    const response: TurnStepResult = {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'tool_use',
      usage,
    };

    return response;
  });

  on('tool.call', () => {
    world.ran += 1;

    const ran = { result: 'done' };

    return world.answer ?? ran;
  });

  on('agent.list', () => {
    if (world.failing === 'agent.list') {
      throw new Error('no agents');
    }

    const listed = { value: [AGENT_INFO] };

    return listed;
  });

  on('ui.toast', (_, e) => {
    if (world.failing === 'ui.toast') {
      throw new Error('no toasts');
    }

    world.toasts.push(e.text);

    const shown = { value: undefined };

    return shown;
  });

  return world;
};

// One model request of a loop, reporting `prompt`; answers the text the stream carried through the plugin.
const step = async ($: Engine, world: World, prompt: number | null, agentId?: string): Promise<string[]> => {
  world.prompt = prompt;

  const stream = $.turn.step({
    turnId: 't',
    index: 0,
    model: 'claude-opus-5-5',
    messageCount: 1,
    ...(agentId === undefined ? {} : { agentId }),
  });
  const texts: string[] = [];

  for await (const chunk of stream) {
    texts.push(chunk.kind === 'text' ? chunk.text : chunk.kind);
  }

  return texts;
};

const call = async ($: Engine, agentId?: string): Promise<ToolCallResult> => {
  const result = await $.tool.call({
    tool: 'Bash',
    command: 'ls',
    ...(agentId === undefined ? {} : { agentId }),
  });

  return result;
};

test('lets a subagent under the warning line work untold', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 999, AGENT);
  const result = await call($, AGENT);

  expect(result.context).toBeUndefined();
  expect(result.deny).toBeUndefined();
  expect(world.ran).toBe(1);
});

test('warns a subagent once past the warning line, after its call ran', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 1000, AGENT);
  const first = await call($, AGENT);
  await step($, world, 1999, AGENT);
  const second = await call($, AGENT);

  expect(first.context).toEqual([WARNING]);
  expect(second.context).toBeUndefined();
  expect(world.ran).toBe(2);
  expect(world.toasts).toEqual([]);
});

test('refuses every call of a subagent past the ceiling, and tells the user once', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 2000, AGENT);
  const first = await call($, AGENT);
  const second = await call($, AGENT);

  expect(first.deny).toBe(REFUSAL);
  expect(second.deny).toBe(REFUSAL);
  expect(world.ran).toBe(0);
  expect(world.toasts).toEqual(['Subagent Port the ceiling passed 2K (2K); its tool calls are refused.']);
});

test('names a subagent the list no longer holds by its id', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 2000, 'agent-2');
  await call($, 'agent-2');

  expect(world.toasts).toEqual(['Subagent agent-2 passed 2K (2K); its tool calls are refused.']);
});

test('lets a subagent work again once its context drops back under, and holds it again past', LIMITS, async (
  $,
  on,
) => {
  const world = fakeWorld(on);
  await step($, world, 2500, AGENT);
  await call($, AGENT);
  await step($, world, 500, AGENT);
  const compacted = await call($, AGENT);
  await step($, world, 1200, AGENT);
  const near = await call($, AGENT);
  await step($, world, 2100, AGENT);
  const over = await call($, AGENT);

  expect(compacted.deny).toBeUndefined();
  expect(near.context).toEqual([WARNING]);
  expect(over.deny).toBe(REFUSAL);
  expect(world.ran).toBe(2);
  expect(world.toasts).toHaveLength(2);
});

test('passes each request\'s stream on whole', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  const texts = await step($, world, 10, AGENT);

  expect(texts).toEqual(['thinking aloud']);
});

test('keeps the last reading through a request that reported no usage', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 2000, AGENT);
  await step($, world, null, AGENT);
  const result = await call($, AGENT);

  expect(result.deny).toBe(REFUSAL);
});

test('tells the user and the model once when the main session passes the ceiling', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 1500);
  const near = await call($);
  await step($, world, 2600);
  const first = await call($);
  const second = await call($);

  expect(near.context).toBeUndefined();
  expect(first.context).toEqual(['Context is 2K, past 2K. Tell the user so in one line, and keep replies lean.']);
  expect(second.context).toBeUndefined();
  expect(world.ran).toBe(3);
  expect(world.toasts).toEqual(['Context passed 2K (2K). Consider /compact or a fresh session.']);
});

test('reads each loop apart: a subagent past the ceiling leaves the main session working', LIMITS, async (
  $,
  on,
) => {
  const world = fakeWorld(on);
  await step($, world, 2000, AGENT);
  await step($, world, 10);
  const main = await call($);
  const agent = await call($, AGENT);

  expect(main.deny).toBeUndefined();
  expect(agent.deny).toBe(REFUSAL);
});

test('keeps a tool result the context is added to', LIMITS, async ($, on) => {
  const world = fakeWorld(on);

  world.answer = {
    result: 'done',
    context: ['from beneath'],
  };

  await step($, world, 1000, AGENT);
  const result = await call($, AGENT);

  expect(result.context).toEqual(['from beneath', WARNING]);
});

test('passes on a refusal from beneath without a warning', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  world.answer = { deny: 'beneath said no' };
  await step($, world, 1000, AGENT);
  const result = await call($, AGENT);

  expect(result).toEqual({ deny: 'beneath said no' });
});

test('refuses the call when the guard fails before it ran', LIMITS, async ($, on) => {
  const world = fakeWorld(on);
  world.failing = 'agent.list';
  await step($, world, 2000, AGENT);
  const result = await call($, AGENT);

  expect(result.deny).toBe('The context ceiling guard failed, so this call is refused. Return your report.');
  expect(world.ran).toBe(0);
});

test('answers what the call settled to when the guard fails after it ran, running it once', LIMITS, async (
  $,
  on,
) => {
  const world = fakeWorld(on);
  world.failing = 'ui.toast';
  await step($, world, 2000);
  const result = await call($);

  expect(result.deny).toBeUndefined();
  expect(world.ran).toBe(1);
});

test('takes the manifest defaults, 130000 and 150000, when no option is set', async ($, on) => {
  const world = fakeWorld(on);
  await step($, world, 129_999, AGENT);
  const under = await call($, AGENT);
  await step($, world, 130_000, AGENT);
  const near = await call($, AGENT);
  await step($, world, 149_999, AGENT);
  const below = await call($, AGENT);
  await step($, world, 150_000, AGENT);
  const over = await call($, AGENT);

  expect(under.context).toBeUndefined();
  expect(near.context).toEqual([WARNING.replace('1K of a 2K', '130K of a 150K')]);
  expect(below.deny).toBeUndefined();
  expect(over.deny).toBe(REFUSAL.replace('is 2K, past the 2K', 'is 150K, past the 150K'));
});

test('takes the limits a project sets in its env over the options', LIMITS, async ($, on) => {
  const world = fakeWorld(on, {
    CONTEXT_WARN_TOKENS: '3000',
    CONTEXT_CEILING_TOKENS: '4000',
  });
  await step($, world, 2999, AGENT);
  const under = await call($, AGENT);
  await step($, world, 3000, AGENT);
  const near = await call($, AGENT);
  await step($, world, 4000, AGENT);
  const over = await call($, AGENT);

  expect(under.context).toBeUndefined();
  expect(near.context).toEqual([WARNING.replace('1K of a 2K', '3K of a 4K')]);
  expect(over.deny).toBe(REFUSAL.replace('is 2K, past the 2K', 'is 4K, past the 4K'));
});

test('keeps the option for an env limit that is not a positive integer', LIMITS, async ($, on) => {
  const world = fakeWorld(on, {
    CONTEXT_WARN_TOKENS: '1.5',
    CONTEXT_CEILING_TOKENS: '0',
  });
  await step($, world, 999, AGENT);
  const under = await call($, AGENT);
  await step($, world, 1000, AGENT);
  const near = await call($, AGENT);
  await step($, world, 2000, AGENT);
  const over = await call($, AGENT);

  expect(under.context).toBeUndefined();
  expect(near.context).toEqual([WARNING]);
  expect(over.deny).toBe(REFUSAL);
});
