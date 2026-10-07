import {
  type Engine,
  expect,
  test,
} from 'claude-code/testing';

import type { On } from 'claude-code';

interface Ci {
  runs: [string, string, string][];
  actions?: string;
  now: number;
  offline?: boolean;
  check?: string;
}

interface Calls {
  gh: number;
}

interface Drawn {
  text?: string;
  marks?: string[];
}

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

const MINUTES_3 = 180_000;

// What `gh run list` and githubstatus.com answer, the clock, and how often `gh` ran.
const fakeCi = (on: On, ci: Ci): Calls => {
  const calls = { gh: 0 };

  on('session.root', () => {
    const root = { value: '/repo' };

    return root;
  });

  on('clock.now', () => {
    const now = { value: ci.now };

    return now;
  });

  on('process.run', (_, e) => {
    const isGh = e.argv[0] === 'gh';
    calls.gh += isGh ? 1 : 0;

    if (ci.offline === true) {
      throw new Error('offline');
    }

    const runs = ci.runs
      .map(([
        workflowName,
        status,
        conclusion,
      ]) => {
        const run = {
          workflowName,
          status,
          conclusion,
        };

        return run;
      });
    const ran = {
      value: {
        exitCode: 0,
        stdout: isGh ? JSON.stringify(runs) : (ci.check ?? ''),
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    };

    return ran;
  });

  on('http.fetch', () => {
    if (ci.offline === true) {
      throw new Error('offline');
    }

    const components = [
      { name: 'Git Operations', status: 'operational' },
      { name: 'Actions', status: ci.actions ?? 'operational' },
    ];
    const fetched = {
      value: {
        status: 200,
        ok: true,
        headers: {},
        text: JSON.stringify({ components }),
      },
    };

    return fetched;
  });

  on('classic.SessionStart', () => {
    return {};
  });

  on('classic.Stop', () => {
    return {};
  });

  on('turn.complete', () => {
    const completed = { text: '' };

    return completed;
  });

  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e);
    return <Box />;
  });

  return calls;
};

const drawn = async ($: Engine, surface: (typeof SURFACES)[number], hasSurvey = false): Promise<Drawn> => {
  const band = await $.ui.mount({
    plugin: 'linteljs',
    surface,
    component: 'AbovePrompt',
    props: {
      ...PROMPT,
      hasSurvey,
    },
  });
  const [line, ...parts] = await band.findAll({ type: 'Text' });
  await band.unmount();

  // Each glyph's colour, and `dim` for a separator.
  const marks = parts
    .map(({ props }) => {
      return props['dimColor'] === true ? 'dim' : String(props['color']);
    });
  const seen = line === undefined ? {} : { text: line.text, marks };

  return seen;
};

const PASSED: Ci['runs'] = [
  [
    'ci',
    'completed',
    'success',
  ],
  [
    'e2e',
    'completed',
    'success',
  ],
  [
    'audit',
    'completed',
    'success',
  ],
];

test('draws main\'s runs and GitHub Actions with a green mark each when everything passed', async ($, on) => {
  fakeCi(on, { runs: [...PASSED, [
    'ci',
    'completed',
    'failure',
  ]], now: 0 });

  await $.classic.SessionStart({ source: 'startup' });

  for (const surface of SURFACES) {
    const band = await drawn($, surface);

    expect(band).toEqual({
      text: 'main  ci ✓  e2e ✓  audit ✓  │  actions ✓',
      marks: [
        'green',
        'green',
        'green',
        'dim',
        'green',
      ],
    });
  }
});

test('marks a failed run and a down Actions red, a running run and a degraded Actions yellow', async ($, on) => {
  const ci: Ci = { runs: [[
    'ci',
    'completed',
    'failure',
  ], [
    'audit',
    'completed',
    'cancelled',
  ]], now: 0 };
  fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });
  const failed = await drawn($, 'terminal');

  ci.runs = [[
    'ci',
    'in_progress',
    '',
  ], [
    'e2e',
    'completed',
    'success',
  ]];

  ci.actions = 'degraded_performance';
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const running = await drawn($, 'terminal');
  ci.actions = 'partial_outage';
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const down = await drawn($, 'terminal');

  expect(failed).toEqual({
    text: 'main  ci ✗  audit ✗  │  actions ✓',
    marks: [
      'red',
      'red',
      'dim',
      'green',
    ],
  });

  expect(running).toEqual({
    text: 'main  ci ◐  e2e ✓  │  actions ◐',
    marks: [
      'yellow',
      'green',
      'dim',
      'yellow',
    ],
  });

  expect(down).toEqual({
    text: 'main  ci ◐  e2e ✓  │  actions ✗',
    marks: [
      'yellow',
      'green',
      'dim',
      'red',
    ],
  });
});

test('draws the check state first, on the same line', async ($, on) => {
  fakeCi(on, {
    runs: PASSED,
    now: 0,
    check: 'stale\n',
  });

  await $.turn.complete({
    answer: '',
    durationMs: 1,
    isAborted: false,
    turnId: 't',
    reason: 'answer',
  });

  const checkOnly = await drawn($, 'terminal');
  await $.classic.SessionStart({ source: 'startup' });
  const both = await drawn($, 'terminal');

  expect(checkOnly).toEqual({ text: '◐ check stale', marks: ['yellow'] });

  expect(both).toEqual({
    text: '◐ check stale  │  main  ci ✓  e2e ✓  audit ✓  │  actions ✓',
    marks: [
      'yellow',
      'dim',
      'green',
      'green',
      'green',
      'dim',
      'green',
    ],
  });
});

test('stays quiet offline, and draws what it could read when one source answers', async ($, on) => {
  const ci: Ci = {
    runs: PASSED,
    now: 0,
    offline: true,
  };
  fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });
  const offline = await drawn($, 'terminal');
  ci.offline = false;
  ci.runs = [];
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const statusOnly = await drawn($, 'terminal');

  expect(offline).toEqual({});
  expect(statusOnly).toEqual({ text: 'actions ✓', marks: ['green'] });
});

test('refreshes when a turn stops, at most every three minutes', async ($, on) => {
  const ci: Ci = { runs: PASSED, now: 1000 };
  const calls = fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });

  ci.runs = [[
    'ci',
    'completed',
    'failure',
  ]];

  ci.now += MINUTES_3 - 1;
  await $.classic.Stop({ stop_hook_active: false });
  const throttled = await drawn($, 'terminal');
  const ghBefore = calls.gh;
  ci.now += 1;
  await $.classic.Stop({ stop_hook_active: false });
  const refreshed = await drawn($, 'terminal');

  expect(ghBefore).toBe(1);
  expect(throttled.text).toBe('main  ci ✓  e2e ✓  audit ✓  │  actions ✓');
  expect(calls.gh).toBe(2);
  expect(refreshed.text).toBe('main  ci ✗  │  actions ✓');
});

test('gives the band up to a survey', async ($, on) => {
  fakeCi(on, { runs: PASSED, now: 0 });
  await $.classic.SessionStart({ source: 'startup' });
  const surveyed = await drawn($, 'terminal', true);

  expect(surveyed).toEqual({});
});
