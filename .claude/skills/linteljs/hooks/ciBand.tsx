// One line above the prompt: the check state, main's latest ci, e2e and audit runs, and whether GitHub Actions is up.
import {
  atom,
  type EngineInterface,
  type On,
  read,
  type RenderChildren,
  update,
} from 'claude-code';

import { MARKS } from './checkBand.tsx';

import type { CiMark } from '../types/index.d.ts';

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

// The check band's atom, which the engine reads only as declared in the module that reads it.
const check = atom({
  plugin: 'linteljs',
  key: 'check',
} as const, null);

const ci = atom({
  plugin: 'linteljs',
  key: 'ci',
} as const, null);

const WORKFLOWS = [
  'ci',
  'e2e',
  'audit',
];
const REFRESH_MS = 180_000;
const STATUS_URL = 'https://www.githubstatus.com/api/v2/components.json';
const MAIN_LABEL = 'main';
const ACTIONS_LABEL = 'actions ';
const SEPARATOR = '  │  ';

const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

const isRun = (value: unknown): value is Run => {
  return isObject(value) && 'workflowName' in value && 'status' in value && 'conclusion' in value;
};

const isRuns = (value: unknown): value is Run[] => {
  return Array.isArray(value) && value.every(isRun);
};

const isComponent = (value: unknown): value is Component => {
  return isObject(value) && 'name' in value && 'status' in value;
};

const isStatus = (value: unknown): value is Status => {
  return isObject(value) && 'components' in value && Array.isArray(value.components)
    && value.components.every(isComponent);
};

const parsedAs = <T,>(text: string | undefined, guard: (value: unknown) => value is T): T | undefined => {
  try {
    const parsed: unknown = JSON.parse(text ?? '');

    return guard(parsed) ? parsed : undefined;
  }
  catch {
    return undefined;
  }
};

const markOf = ({ status, conclusion }: Run): CiMark => {
  if (status !== 'completed') {
    return 'running';
  }

  return conclusion === 'success' ? 'passed' : 'failed';
};

const runMarks = async ($: EngineInterface, cwd: string): Promise<[string, CiMark][]> => {
  const argv = [
    'gh',
    'run',
    'list',
    '--branch',
    'main',
    '--limit',
    '30',
    '--json',
    'workflowName,status,conclusion',
  ];
  let stdout: string | undefined;

  try {
    const listed = await $.process.run(argv, { cwd });
    stdout = listed.exitCode === 0 ? listed.stdout : undefined;
  }
  catch {
    stdout = undefined;
  }

  const runs = parsedAs(stdout, isRuns) ?? [];

  return WORKFLOWS
    .flatMap((name) => {
      const latest = runs
        .find(({ workflowName }) => {
          return workflowName === name;
        });

      const marks: [string, CiMark][] = latest === undefined ? [] : [[name, markOf(latest)]];

      return marks;
    });
};

const actionsMark = async ($: EngineInterface): Promise<CiMark | null> => {
  let text: string | undefined;

  try {
    const response = await $.http.fetch(STATUS_URL);
    text = response.ok ? response.text : undefined;
  }
  catch {
    text = undefined;
  }

  const status = parsedAs(text, isStatus);
  const actions = status?.components
    .find(({ name }) => {
      return name === 'Actions';
    });

  if (actions === undefined) {
    return null;
  }

  if (actions.status === 'operational') {
    return 'passed';
  }

  return actions.status === 'degraded_performance' ? 'running' : 'failed';
};

// Main session only, and at most every few minutes; offline or without `gh` it draws what it could read.
const refresh = async ($: EngineInterface): Promise<void> => {
  const now = await $.clock.now();
  const last = await read($, ci);

  if (last !== null && now - last.at < REFRESH_MS) {
    return;
  }

  const root = await $.session.root();
  const runs = await runMarks($, root);
  const actions = await actionsMark($);
  const band = {
    at: now,
    runs,
    actions,
  };

  await update($, ci, () => {
    return band;
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

  // The check band's render too, so both draw on one line; a segment with nothing read is left out.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const word = await read($, check);
    const band = await read($, ci);
    const { Box, Text } = $.ui.resolve(e);

    const mark = ([glyph, color]: [string, string]): RenderChildren => {
      return <Text color={color}>{glyph}</Text>;
    };

    const runs = band?.runs ?? [];
    const actions = band?.actions ?? null;
    const runParts = runs
      .flatMap(([name, state]) => {
        const part = [`  ${name} `, mark(MARKS[state])];

        return part;
      });
    const checkSegment = word === null ? [] : [mark(MARKS[word]), ` check ${word}`];
    const mainSegment = runs.length === 0 ? [] : [MAIN_LABEL, ...runParts];
    const actionsSegment = actions === null ? [] : [ACTIONS_LABEL, mark(MARKS[actions])];
    const segments = [
      checkSegment,
      mainSegment,
      actionsSegment,
    ]
      .filter((segment) => {
        return segment.length > 0;
      });

    if (e.props.hasSurvey || segments.length === 0) {
      return next(e);
    }

    const line = segments
      .flatMap((segment, index) => {
        const separated = [<Text dimColor>{SEPARATOR}</Text>, ...segment];

        return index === 0 ? segment : separated;
      });
    const below = await next(e);

    return (
      <Box flexDirection="column">
        <Text>{line}</Text>
        {below}
      </Box>
    );
  });
};
