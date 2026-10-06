// The band under the check band: main's latest ci, e2e and audit runs, and whether GitHub Actions is up.
import {
  atom,
  type EngineInterface,
  type On,
  read,
  update,
} from 'claude-code';

import type { CiBand } from '../types/index.d.ts';

const ci = atom({
  plugin: 'linteljs',
  key: 'ci',
} as const, null);

const WORKFLOWS = ['ci', 'e2e', 'audit'];
const REFRESH_MS = 180_000;
const STATUS_URL = 'https://www.githubstatus.com/api/v2/components.json';

interface Run {
  workflowName: string;
  status: string;
  conclusion: string;
}

interface Component {
  name: string;
  status: string;
}

interface Status {
  components: Component[];
}

const isRun = (value: unknown): value is Run => {
  return typeof value === 'object' && value !== null && 'workflowName' in value && 'status' in value
    && 'conclusion' in value;
};

const isRuns = (value: unknown): value is Run[] => {
  return Array.isArray(value) && value.every(isRun);
};

const isComponent = (value: unknown): value is Component => {
  return typeof value === 'object' && value !== null && 'name' in value && 'status' in value;
};

const isStatus = (value: unknown): value is Status => {
  return typeof value === 'object' && value !== null && 'components' in value && Array.isArray(value.components)
    && value.components.every(isComponent);
};

const parsedAs = <T,>(text: string | undefined, guard: (value: unknown) => value is T): T | undefined => {
  try {
    const parsed: unknown = JSON.parse(text ?? '');

    return guard(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const wordOf = ({ status, conclusion }: Run): string => {
  if (status !== 'completed') {
    return 'running';
  }

  return conclusion === 'success' ? 'passed' : conclusion.replace('failure', 'failed');
};

const runWords = async ($: EngineInterface, cwd: string): Promise<string[]> => {
  const argv = ['gh', 'run', 'list', '--branch', 'main', '--limit', '30', '--json', 'workflowName,status,conclusion'];
  const listed = await $.process.run(argv, { cwd })
    .catch(() => {
      return undefined;
    });
  const runs = parsedAs(listed?.exitCode === 0 ? listed.stdout : undefined, isRuns) ?? [];

  return WORKFLOWS.flatMap((name) => {
    const latest = runs.find(({ workflowName }) => {
      return workflowName === name;
    });

    return latest === undefined ? [] : [`${name} ${wordOf(latest)}`];
  });
};

const actionsWord = async ($: EngineInterface): Promise<string | undefined> => {
  const response = await $.http.fetch(STATUS_URL)
    .catch(() => {
      return undefined;
    });
  const status = parsedAs(response?.ok === true ? response.text : undefined, isStatus);
  const actions = status?.components.find(({ name }) => {
    return name === 'Actions';
  });

  return actions?.status.replaceAll('_', ' ');
};

const colorOf = (words: string[], actions: string | undefined): CiBand['color'] => {
  if (words.some((word) => {
    return !word.endsWith(' passed') && !word.endsWith(' running');
  })) {
    return 'red';
  }

  return actions === 'operational' && words.every((word) => {
    return word.endsWith(' passed');
  })
    ? 'green'
    : 'yellow';
};

// Main session only, and at most every few minutes; offline or without `gh` it draws what it could read.
const refresh = async ($: EngineInterface): Promise<void> => {
  const now = await $.clock.now();
  const last = await read($, ci);

  if (last !== null && now - last.at < REFRESH_MS) {
    return;
  }

  const words = await runWords($, await $.session.root());
  const actions = await actionsWord($);
  const parts = [...(words.length > 0 ? [`main: ${words.join(', ')}`] : []), ...(actions === undefined ? [] : [`GitHub Actions ${actions}`])];

  await update($, ci, () => {
    return {
      at: now,
      color: colorOf(words, actions),
      text: parts.join(' · '),
    };
  });
};

export const registerCiBand = (on: On): void => {
  // The classic events, since the check band holds `session.start` and `turn.complete`; `Stop` is the main session's.
  on('classic.SessionStart', async ($, e, next) => {
    await refresh($);

    return next(e);
  });

  on('classic.Stop', async ($, e, next) => {
    await refresh($);

    return next(e);
  });

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const band = await read($, ci);

    if (e.props.hasSurvey || band === null || band.text === '') {
      return next(e);
    }

    const { Box, Text } = $.ui.resolve(e);

    return (
      <Box flexDirection="column">
        {await next(e)}
        <Text color={band.color}>{band.text}</Text>
      </Box>
    );
  });
};
