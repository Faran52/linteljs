import {
  type Engine,
  expect,
  test,
} from 'claude-code/testing';

import type { On } from 'claude-code';

interface Printed {
  word: string;
  runs?: boolean;
}

type Surface = (typeof SURFACES)[number];

const PROMPT = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 80,
  scroll: {
    offset: 0,
    bodyRows: 1,
  },
  view: {},
};

const SURFACES = ['terminal', 'desktop'] as const;

// What `checkStatusHook.ts` prints, or that node cannot run it, and every argv the band ran.
const fakeStatus = (on: On, printed: Printed): (readonly string[])[] => {
  const runs: (readonly string[])[] = [];

  on('session.root', () => {
    const root = { value: '/project' };

    return root;
  });

  on('process.run', (_, e) => {
    runs.push(e.argv);

    if (printed.runs === false) {
      throw new Error('node is not on PATH');
    }

    const ran = {
      value: {
        exitCode: 0,
        stdout: `${printed.word}\n`,
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    };

    return ran;
  });

  on('turn.complete', () => {
    const completed = { text: '' };

    return completed;
  });

  on('session.start', () => {
    const started = { cwd: '/project' };

    return started;
  });

  // The engine's own band, empty: the tree the band draws above.
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e);
    return <Box />;
  });

  return runs;
};

const complete = async ($: Engine, agentId?: string): Promise<void> => {
  await $.turn.complete({
    answer: '',
    durationMs: 1,
    isAborted: false,
    turnId: 't',
    reason: 'answer',
    ...(agentId === undefined ? {} : { agentId }),
  });
};

const bandText = async ($: Engine, surface: Surface, hasSurvey = false): Promise<string | undefined> => {
  const band = await $.ui.mount({
    plugin: 'linteljs',
    surface,
    component: 'AbovePrompt',
    props: {
      ...PROMPT,
      hasSurvey,
    },
  });
  const found = await band.find({ type: 'Text' });
  await band.unmount();

  return found?.text;
};

test('draws the state word checkStatusHook.ts prints at session start', async ($, on) => {
  const runs = fakeStatus(on, { word: 'passed' });

  await $.session.start({
    cwd: '/project',
    surface: 'terminal',
    isInteractive: true,
  });

  for (const surface of SURFACES) {
    const text = await bandText($, surface);

    expect(text).toBe('check passed on this tree');
  }

  expect(runs[0]?.[0]).toBe('node');
  expect(runs[0]?.[1]).toMatch(/\/hooks\/checkStatusHook\.ts$/u);
});

test('reads the word again when a main turn ends, and not when a subagent\'s does', async ($, on) => {
  const printed: Printed = { word: 'stale' };
  fakeStatus(on, printed);
  await complete($);
  const stale = await bandText($, 'terminal');
  printed.word = 'failed';
  await complete($, 'agent-1');
  const afterAgent = await bandText($, 'terminal');
  await complete($);
  const failed = await bandText($, 'terminal');

  expect(stale).toBe('check stale: files changed since it passed');
  expect(afterAgent).toBe(stale);
  expect(failed).toBe('check failed when it last ran');
});

test('stays away outside a checked project, and when the script cannot run', async ($, on) => {
  const printed: Printed = { word: '' };
  fakeStatus(on, printed);
  await complete($);
  const outside = await bandText($, 'terminal');
  printed.word = 'running';
  await complete($);
  const running = await bandText($, 'terminal');
  printed.runs = false;
  await complete($);
  const unrunnable = await bandText($, 'terminal');

  expect(outside).toBeUndefined();
  expect(running).toBe('check running, or stopped before it finished');
  expect(unrunnable).toBeUndefined();
});

test('gives the band up to a survey', async ($, on) => {
  fakeStatus(on, { word: 'none' });
  await complete($);
  const shown = await bandText($, 'terminal');
  const surveyed = await bandText($, 'terminal', true);

  expect(shown).toBe('check has not run on these files');
  expect(surveyed).toBeUndefined();
});
