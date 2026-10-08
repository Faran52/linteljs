import { answersFor, hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { workspaceOf } from '../../../utils/layoutUtils';

import {
  fillSlots,
  sharedSlots,
  workspaceSlots,
} from './templateUtils';

describe('fillSlots', () => {
  it('replaces every slot with its value', () => {
    const filled = fillSlots('{{A}} and {{B}}', {
      A: 'one',
      B: 'two',
    }, 'label');

    expect(filled).toBe('one and two');
  });

  it('replaces a slot repeated more than once', () => {
    const filledSlots = fillSlots('{{A}}-{{A}}', { A: 'x' }, 'label');
    expect(filledSlots).toBe('x-x');
  });

  it('throws naming the label and every slot left unfilled', () => {
    expect(() => {
      return fillSlots('{{A}} {{B}} {{C}}', { A: 'one' }, 'CLAUDE.md');
    }).toThrow(
      'CLAUDE.md template has unfilled slots: {{B}}, {{C}}',
    );
  });

  it('leaves a template with no slots untouched', () => {
    const filledSlots = fillSlots('plain text', {}, 'label');
    expect(filledSlots).toBe('plain text');
  });
});

describe('sharedSlots', () => {
  it('names the project, the target label and the package manager run prefix', () => {
    const slots = sharedSlots('demo-app', answersFor({ target: 'react' }));

    expect(slots['PROJECT_NAME']).toBe('demo-app');
    expect(slots['TARGET_LABEL']).toBe('React (Vite)');
    expect(slots['RUN']).toBe('pnpm');
  });

  it.each([
    [
      'pnpm',
      'pnpm exec',
      'pnpm dlx @linteljs/create sync',
    ],
    [
      'npm',
      'npx',
      'npx @linteljs/create sync',
    ],
    [
      'yarn',
      'yarn',
      'yarn dlx @linteljs/create sync',
    ],
    [
      'bun',
      'bunx',
      'bunx @linteljs/create sync',
    ],
  ] as const)('runs a project binary and sync under %s', (packageManager, exec, sync) => {
    const { EXEC: actualExec, SYNC: actualSync } = sharedSlots('demo-app', answersFor({ packageManager }));

    expect(actualExec).toBe(exec);
    expect(actualSync).toBe(sync);
  });

  it.each([
    'pnpm',
    'npm',
    'yarn',
    'bun',
  ] as const)('installs with the bare install command under %s', (packageManager) => {
    const { INSTALL: install } = sharedSlots('demo-app', answersFor({ packageManager }));

    expect(install).toBe(`${packageManager} install`);
  });

  it('carries the check chain built from the answers', () => {
    const { CHECK_CHAIN: checkChain } = sharedSlots('demo-app', answersFor({}));
    expect(checkChain).toContain('lint');
  });

  it('adds the test and coverage rows only when there is a test runner', () => {
    const { COMMAND_ROWS: vitestRows } = sharedSlots('demo-app', answersFor({ testing: 'vitest' }));
    const { COMMAND_ROWS: untestedRows } = sharedSlots('demo-app', answersFor({ testing: 'none' }));

    expect(vitestRows)
      .toContain('| test | `pnpm test` |\n| coverage | `pnpm test:coverage` |\n');

    expect(untestedRows).not.toContain('test');
  });

  it('runs every row in a single repo with the run prefix', () => {
    const { COMMAND_ROWS: rows } = sharedSlots('demo-app', answersFor({ packageManager: 'npm', testing: 'none' }));

    const expected = [
      '| lint | `npm run lint:fix`, then `npm run lint` |',
      '| lint styles | `npm run lint:css` |',
      '| typecheck | `npm run typecheck` |',
      '| build | `npm run build` |',
      '| full gate | `npm run check` |',
      '',
    ].join('\n');

    expect(rows).toBe(expected);
  });

  it('runs every row but the gate through the app from a monorepo root', () => {
    const answers = answersFor({
      packageManager: 'pnpm',
      testing: 'vitest',
      layout: 'monorepo',
    });

    const { COMMAND_ROWS: rows, CHECK_CHAIN: chain } = sharedSlots('shop', answers);

    const expected = [
      '| lint | `pnpm --filter shop lint:fix`, then `pnpm --filter shop lint` |',
      '| lint styles | `pnpm --filter shop lint:css` |',
      '| typecheck | `pnpm --filter shop typecheck` |',
      '| test | `pnpm --filter shop test` |',
      '| coverage | `pnpm --filter shop test:coverage` |',
      '| build | `pnpm --filter shop build` |',
      '| full gate | `pnpm check` |',
      '',
    ].join('\n');

    expect(rows).toBe(expected);

    expect(chain).toBe('pnpm lint && pnpm typecheck && pnpm -r --if-present run check');
  });

  it('says nothing of workspaces in a single repo', () => {
    const { WORKSPACE: note } = sharedSlots('demo-app', answersFor({}));

    expect(note).toBe('');
  });

  it.each([
    [
      'pnpm',
      'react',
      'apps',
      '`pnpm --filter @acme/shop dev`',
    ],
    [
      'npm',
      'react',
      'apps',
      '`npm run dev -w @acme/shop`',
    ],
    [
      'yarn',
      'react',
      'apps',
      '`yarn workspace @acme/shop dev`',
    ],
    [
      'bun',
      'typescript',
      'packages',
      '`bun run --filter @acme/shop build`',
    ],
  ] as const)('names the app and a filtered run from a %s %s monorepo root', (packageManager, target, parent, run) => {
    const answers = answersFor({
      packageManager,
      target,
      layout: 'monorepo',
    });

    const { WORKSPACE: note } = sharedSlots('@acme/shop', answers);

    const opening = `The app lives in \`${parent}/shop/\`, and the commands above run its scripts from the root. `;
    const opens = note?.startsWith(opening);

    expect(opens).toBe(true);
    expect(note).toContain('`check` runs them, then every package\'s `check`.');
    expect(note).toContain(`from the root: ${run}.\n\n`);
  });
});

describe('workspaceSlots', () => {
  it('counts the projects and gives each its own section, label and directory', () => {
    const workspace = workspaceOf('acme', [
      { name: 'web', answers: hostedAnswersFor({ target: 'react', layout: 'monorepo' }) },
      { name: 'lib', answers: hostedAnswersFor({ target: 'typescript', layout: 'monorepo' }) },
    ]);

    const slots = workspaceSlots(workspace);

    expect(slots['PROJECT_NAME']).toBe('acme');
    expect(slots['TARGET_LABEL']).toBe('A workspace of 2 projects');
    expect(slots['COMMAND_ROWS']).toBe('| full gate | `pnpm check` |\n');
    expect(slots['WORKSPACE']).toContain('### web\n\nReact (Vite), in `apps/web/`.');
    expect(slots['WORKSPACE']).toContain('### lib\n\n');
    expect(slots['WORKSPACE']).toContain('in `packages/lib/`.');
    expect(slots['WORKSPACE']).toContain('every package\'s `check`');
  });
});
