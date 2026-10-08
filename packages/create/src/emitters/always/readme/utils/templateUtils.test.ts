import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { fillSlots, sharedSlots } from './templateUtils';

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
    const { TEST_ROWS: vitestRows } = sharedSlots('demo-app', answersFor({ testing: 'vitest' }));
    const { TEST_ROWS: untestedRows } = sharedSlots('demo-app', answersFor({ testing: 'none' }));

    expect(vitestRows)
      .toContain('| test | `pnpm test` |');

    expect(untestedRows).toBe('');
  });

  it('says nothing of workspaces in a single repo', () => {
    const { WORKSPACE: note } = sharedSlots('demo-app', answersFor({}));

    expect(note).toBe('');
  });

  it.each([
    [
      'pnpm',
      'react',
      '`pnpm --filter @acme/shop dev`',
    ],
    [
      'npm',
      'react',
      '`npm run dev -w @acme/shop`',
    ],
    [
      'yarn',
      'react',
      '`yarn workspace @acme/shop dev`',
    ],
    [
      'bun',
      'typescript',
      '`bun run --filter @acme/shop build`',
    ],
  ] as const)('names the app and a filtered run from the root of a %s %s monorepo', (packageManager, target, run) => {
    const answers = answersFor({
      packageManager,
      target,
      layout: 'monorepo',
    });

    const { WORKSPACE: note } = sharedSlots('@acme/shop', answers);

    expect(note).toMatch(/^The app lives in `apps\/shop\/`, and every package carries these scripts\. /u);
    expect(note).toContain('`check` runs them, then every package\'s `check`.');
    expect(note).toContain(`from the root: ${run}.\n\n`);
  });
});
