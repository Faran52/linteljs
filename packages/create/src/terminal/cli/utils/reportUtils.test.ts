import { stdout } from 'node:process';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { SPINNER_FRAMES, SPINNER_INTERVAL } from '../constants';

import {
  installCommands,
  nextSteps,
  say,
  stageLine,
  stageReport,
  stepsPlan,
  syncTable,
} from './reportUtils';

import type { CliOptions } from './argvUtils';

const OPTIONS: CliOptions = {
  command: 'create',
  name: 'demo',
  cwd: '/projects/demo',
  skip: [],
  existing: false,
  unknownSkips: [],
  unexpectedArguments: [],
  yes: true,
  seed: false,
  help: false,
  version: false,
};

const asTerminal = (value: boolean | undefined): void => {
  Object.defineProperty(stdout, 'isTTY', {
    value,
    configurable: true,
    writable: true,
  });
};

const inherited = stdout.isTTY;

const printed = (run: () => void): string => {
  const chunks: string[] = [];
  const writing = vi.spyOn(stdout, 'write')
    .mockImplementation((chunk) => {
      chunks.push(String(chunk));

      return true;
    });

  try {
    run();

    return chunks.join('');
  }
  finally {
    writing.mockRestore();
  }
};

afterEach(() => {
  asTerminal(inherited);
});

describe('stageLine', () => {
  it('counts the files a stage wrote', () => {
    const actual = stageLine('standard', 44, '', 123);
    expect(actual).toBe('standard  44 files, 0.1s');
  });

  it('counts one file in the singular', () => {
    const actual = stageLine('lint', 1, '', 40);
    expect(actual).toBe('lint      1 file, 0.0s');
  });

  it('falls back to what a stage said where it wrote nothing', () => {
    const actual = stageLine('install', 0, 'installing with pnpm', 12_100);
    expect(actual).toBe('install   installing with pnpm, 12.1s');
  });

  it('omits the time while the stage is still running', () => {
    const actual = stageLine('standard', 12, '');
    expect(actual).toBe('standard  12 files');
  });

  it('carries the time alone where a stage neither wrote nor spoke', () => {
    const actual = stageLine('fix', 0, '', 8400);
    expect(actual).toBe('fix       8.4s');
  });

  it('is the stage name alone where there is nothing yet to say', () => {
    const actual = stageLine('fix', 0, '');
    expect(actual).toBe('fix');
  });
});

describe('stepsPlan', () => {
  it('numbers every stage in order', () => {
    const actual = stepsPlan(OPTIONS);
    expect(actual).toContain('  1. lint:');
    const actual2 = stepsPlan(OPTIONS);
    expect(actual2).toContain('  4. install');
  });

  it('marks a skipped stage, and the fix that skipping lint takes with it', () => {
    const plan = stepsPlan({
      ...OPTIONS,
      skip: ['lint'],
    });

    expect(plan).toContain('  1. lint: eslint and stylelint config (skipped)');
    expect(plan).toContain('  5. fix: eslint and stylelint --fix (skipped)');
    expect(plan).not.toContain('lint: (skipped)');
  });

  it('is a header and one numbered line per stage, none marked where nothing was skipped', () => {
    const parts = stepsPlan(OPTIONS).split('\n');
    const expected = [
      '',
      'Steps:',
      '  1. lint: eslint and stylelint config',
      '  2. package: package.json, tsconfig and the manager files',
      '  3. standard: hooks, agent files, test setup and starter tests',
      '  4. install',
      '  5. fix: eslint and stylelint --fix',
    ];
    expect(parts).toEqual(expected);
  });

  it('marks only the stages lint takes with it, not every stage after it', () => {
    const plan = stepsPlan({
      ...OPTIONS,
      skip: ['lint'],
    });

    const skipped = plan
      .split('\n')
      .filter((line) => {
        return line.endsWith('(skipped)');
      });

    expect(skipped).toHaveLength(2);
  });
});

describe('nextSteps', () => {
  const INSTALL_SKIPPED: CliOptions = {
    ...OPTIONS,
    skip: ['install', 'fix'],
  };

  it('enters the directory a named create made, then the steps it skipped', () => {
    const actual = nextSteps('demo-app', INSTALL_SKIPPED, 'pnpm');

    expect(actual)
      .toBe('\nDone. Next:\n  cd demo-app\n  pnpm install\n  pnpm lint:fix\n  pnpm check');
  });

  it.each<[string, CliOptions, string]>([
    [
      'an existing directory',
      {
        ...INSTALL_SKIPPED,
        existing: true,
      },
      'demo-app',
    ],
    [
      'the directory it stands in',
      INSTALL_SKIPPED,
      '',
    ],
  ])('enters nothing for %s', (_case, options, name) => {
    const actual = nextSteps(name, options, 'pnpm');
    expect(actual).toBe('\nDone. Next:\n  pnpm install\n  pnpm lint:fix\n  pnpm check');
  });

  it('leaves only the gate once it installed', () => {
    const actual = nextSteps('', OPTIONS, 'pnpm');
    expect(actual).toBe('\nDone. Next:\n  pnpm check');
  });

  it.each([
    ['npm', 'npm install\n  npm run lint:fix\n  npm run check'],
    ['yarn', 'yarn install\n  yarn lint:fix\n  yarn check'],
  ] as const)('spells each command the way %s runs it', (manager, commands) => {
    const actual = nextSteps('', INSTALL_SKIPPED, manager);
    expect(actual).toBe(`\nDone. Next:\n  ${commands}`);
  });
});

describe('say', () => {
  it('writes one line', () => {
    const actual = printed(() => {
      say('a line');
    });
    expect(actual).toBe('a line\n');
  });
});

describe('stageReport behind a pipe', () => {
  it('prints the plan as it is built, then a line per event', () => {
    asTerminal(undefined);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('package', 3, 6);
      report.onWrite('package.json');
      report.onNotice('removed tsconfig.app.json, which nothing references now');
      report.onStageDone('package', 60);
    });

    expect(output).toContain('Steps:');
    expect(output).toContain('[3/6] package: package.json, tsconfig and the manager files\n');
    expect(output).toContain('  wrote package.json\n');
    expect(output).toContain('  removed tsconfig.app.json, which nothing references now\n');
    expect(output).toContain('      done in 0.1s\n');
  });
});

describe('stageReport on a terminal', () => {
  it('replaces the spinner with what the stage did, and prints no plan', () => {
    asTerminal(true);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('standard', 4, 6);
      report.onNotice('git init: the husky hooks install on the next install');
      report.onWrite('CLAUDE.md');
      report.onWrite('AGENTS.md');
      report.onStageDone('standard', 100);
    });

    expect(output).not.toContain('Steps:');
    expect(output).not.toContain('wrote CLAUDE.md');
    expect(output).toContain('standard');
    expect(output).toContain('\u2713 standard  2 files, 0.1s');
  });

  it('spins for a stage that spawns a binary, and says what it said', () => {
    asTerminal(true);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('install', 5, 6);
      report.onNotice('installing with pnpm');
      report.onStageDone('install', 12_100);
    });

    expect(output).toContain('\u2713 install   installing with pnpm, 12.1s');
  });

  it('paints the first frame as the stage starts, and turns one frame per interval', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const output = printed(() => {
        stageReport(OPTIONS).onStage('standard', 3, 5);
        vi.advanceTimersByTime(SPINNER_INTERVAL);
      });

      const char = SPINNER_FRAMES.charAt(2);
      expect(char).not.toBe(SPINNER_FRAMES.charAt(1));

      expect(output).toBe([
        `\u001B[K  ${SPINNER_FRAMES.charAt(1)} standard\r`,
        `\u001B[K  ${SPINNER_FRAMES.charAt(2)} standard\r`,
      ].join(''));
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('starts each stage from a clean line rather than the last stage\'s count', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const output = printed(() => {
        const report = stageReport(OPTIONS);

        report.onStage('lint', 1, 5);
        report.onWrite('eslint.config.js');
        report.onNotice('said by lint');
        report.onStageDone('lint', 10);
        report.onStage('package', 2, 5);
      });

      const actual = output.endsWith(`\u001B[K  ${SPINNER_FRAMES.charAt(2)} package\r`);
      expect(actual).toBe(true);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('stops turning once the stage is done', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const report = stageReport(OPTIONS);

      const output = printed(() => {
        report.onStage('install', 4, 5);
        report.onStageDone('install', 10);
        vi.advanceTimersByTime(SPINNER_INTERVAL * 3);
      });

      const install00sEndsWith = output.endsWith('✓ install   0.0s\n');
      expect(install00sEndsWith).toBe(true);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('captures a spawn on a terminal and lets it write behind a pipe', () => {
    asTerminal(true);

    expect(stageReport(OPTIONS).output).toBe('capture');

    asTerminal(undefined);

    let output = '';

    printed(() => {
      ({ output } = stageReport(OPTIONS));
    });

    expect(output).toBe('inherit');
  });
});

describe('syncTable', () => {
  it('lists each file under what sync does to it, then each @linteljs/* version from and to', () => {
    const table = syncTable({
      entries: [],
      pending: [
        {
          target: '.husky/pre-commit',
          status: 'changed',
        },
        {
          target: 'scripts/new.ts',
          status: 'missing',
        },
        {
          target: '.claude/settings.json',
          status: 'obsolete',
        },
      ],
      upgrades: [
        {
          name: '@linteljs/eslint-config',
          from: '^1.5.0',
          to: '^2.0.0',
        },
        {
          name: '@linteljs/eslint-plugin',
          to: '^2.0.0',
        },
      ],
      missing: {
        dependencies: {},
        devDependencies: {},
      },
    });

    const parts = table.split('\n');
    const expected = [
      '  update   .husky/pre-commit',
      '  add      scripts/new.ts',
      '  delete   .claude/settings.json',
      '  upgrade  @linteljs/eslint-config ^1.5.0 -> ^2.0.0',
      '  upgrade  @linteljs/eslint-plugin none -> ^2.0.0',
    ];
    expect(parts).toEqual(expected);
  });
});

describe('installCommands', () => {
  it('prints one quoted add per field, in the project\'s package manager', () => {
    const commands = installCommands('npm', {
      dependencies: { qs: '^6.0.0' },
      devDependencies: {
        'husky': '^9.0.0',
        'lint-staged': '^16.0.0',
      },
    });

    const expected = [
      '  npm install "qs@^6.0.0"',
      '  npm install -D "husky@^9.0.0" "lint-staged@^16.0.0"',
    ];
    expect(commands).toEqual(expected);
  });

  it('prints nothing when nothing is missing', () => {
    const commands = installCommands('pnpm', {
      dependencies: {},
      devDependencies: {},
    });

    expect(commands).toEqual([]);
  });
});
