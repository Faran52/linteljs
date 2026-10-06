import type { On } from 'claude-code';
import {
  type Engine,
  expect,
  test,
} from 'claude-code/testing';

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

interface Ci {
  runs: [string, string, string][];
  actions?: string;
  now: number;
  offline?: boolean;
}

// What `gh run list` and githubstatus.com answer, the clock, and how often `gh` ran.
const fakeCi = (on: On, ci: Ci): { gh: number } => {
  const calls = { gh: 0 };

  on('session.root', () => {
    return { value: '/repo' };
  });
  on('clock.now', () => {
    return { value: ci.now };
  });
  on('process.run', (_, e) => {
    const isGh = e.argv[0] === 'gh';
    calls.gh += isGh ? 1 : 0;

    if (ci.offline === true) {
      throw new Error('offline');
    }

    const runs = ci.runs.map(([workflowName, status, conclusion]) => {
      return {
        workflowName,
        status,
        conclusion,
      };
    });

    return {
      value: {
        exitCode: 0,
        stdout: isGh ? JSON.stringify(runs) : '',
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    };
  });
  on('http.fetch', () => {
    if (ci.offline === true) {
      throw new Error('offline');
    }

    const components = [{ name: 'Git Operations', status: 'operational' }, { name: 'Actions', status: ci.actions ?? 'operational' }];

    return {
      value: {
        status: 200,
        ok: true,
        headers: {},
        text: JSON.stringify({ components }),
      },
    };
  });
  on('classic.SessionStart', () => {
    return {};
  });
  on('classic.Stop', () => {
    return {};
  });
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e);
    return <Box />;
  });

  return calls;
};

interface Drawn {
  text?: string;
  color?: string;
}

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
  const found = await band.find({ type: 'Text' });
  await band.unmount();

  return found === undefined ? {} : { text: found.text, color: String(found.props['color']) };
};

const PASSED: Ci['runs'] = [['ci', 'completed', 'success'], ['e2e', 'completed', 'success'], ['audit', 'completed', 'success']];

test('draws main\'s runs and GitHub Actions green when everything passed', async ($, on) => {
  fakeCi(on, { runs: [...PASSED, ['ci', 'completed', 'failure']], now: 0 });
  await $.classic.SessionStart({ source: 'startup' });

  for (const surface of SURFACES) {
    const band = await drawn($, surface);

    expect(band).toEqual({
      text: 'main: ci passed, e2e passed, audit passed · GitHub Actions operational',
      color: 'green',
    });
  }
});

test('draws red for a failed or cancelled run, and yellow for a running one or a degraded Actions', async ($, on) => {
  const ci: Ci = { runs: [['ci', 'completed', 'failure'], ['audit', 'completed', 'cancelled']], now: 0 };
  fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });
  const failed = await drawn($, 'terminal');
  ci.runs = [['ci', 'in_progress', ''], ['e2e', 'completed', 'success']];
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const running = await drawn($, 'terminal');
  ci.runs = PASSED;
  ci.actions = 'partial_outage';
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const degraded = await drawn($, 'terminal');

  expect(failed).toEqual({
    text: 'main: ci failed, audit cancelled · GitHub Actions operational',
    color: 'red',
  });
  expect(running).toEqual({
    text: 'main: ci running, e2e passed · GitHub Actions operational',
    color: 'yellow',
  });
  expect(degraded).toEqual({
    text: 'main: ci passed, e2e passed, audit passed · GitHub Actions partial outage',
    color: 'yellow',
  });
});

test('stays quiet offline, and draws what it could read when one source answers', async ($, on) => {
  const ci: Ci = { runs: PASSED, now: 0, offline: true };
  fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });
  const offline = await drawn($, 'terminal');
  ci.offline = false;
  ci.runs = [];
  ci.now += MINUTES_3;
  await $.classic.SessionStart({ source: 'clear' });
  const statusOnly = await drawn($, 'terminal');

  expect(offline).toEqual({});
  expect(statusOnly).toEqual({ text: 'GitHub Actions operational', color: 'yellow' });
});

test('refreshes when a turn stops, at most every three minutes', async ($, on) => {
  const ci: Ci = { runs: PASSED, now: 1000 };
  const calls = fakeCi(on, ci);
  await $.classic.SessionStart({ source: 'startup' });
  ci.runs = [['ci', 'completed', 'failure']];
  ci.now += MINUTES_3 - 1;
  await $.classic.Stop({ stop_hook_active: false });
  const throttled = await drawn($, 'terminal');
  const ghBefore = calls.gh;
  ci.now += 1;
  await $.classic.Stop({ stop_hook_active: false });
  const refreshed = await drawn($, 'terminal');

  expect(ghBefore).toBe(1);
  expect(throttled.color).toBe('green');
  expect(calls.gh).toBe(2);
  expect(refreshed.color).toBe('red');
});

test('gives the band up to a survey', async ($, on) => {
  fakeCi(on, { runs: PASSED, now: 0 });
  await $.classic.SessionStart({ source: 'startup' });
  const surveyed = await drawn($, 'terminal', true);

  expect(surveyed).toEqual({});
});
