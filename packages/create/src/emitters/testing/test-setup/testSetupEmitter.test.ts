import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type ProjectShape,
  type TargetId,
} from '@config/types';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader, TEMPLATES_ROOT } from '@disk';

import { testSetupEmitter } from './testSetupEmitter';

// A project that holds neither spelling, so the target's own is the one written.
const FRESH: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

describe('testSetupEmitter', () => {
  it('writes nothing for a project that asked for no tests', () => {
    expect(testSetupEmitter({
      ...DEFAULT_ANSWERS,
      testing: 'none',
    }, FRESH)).toEqual([]);
  });

  // Preserved, so a project keeps the mocks it added to the file after the first run.
  it('joins the target setup and its router mocks into the spelling React needs', () => {
    expect(testSetupEmitter(DEFAULT_ANSWERS, FRESH)).toEqual([{
      stage: 'standard',
      target: '__mocks__/setupTests.tsx',
      content: {
        sources: [
          'fragments/test-setup/setupTests.ts',
          'fragments/test-setup/setupTests.router.ts',
        ],
      },
      preserve: true,
    }]);
  });

  it('appends the fragment a selected library brings', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      libraries: [],
      data: 'tanstack-query',
    }, FRESH);

    expect(artifact?.content).toHaveProperty('sources', [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
      'fragments/test-setup/setupTests.tanstackQuery.ts',
    ]);
  });

  // The target's own file first: it is the one with imports, and the fragments after it have none.
  it('leads with the target setup where the target ships one', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'angular',
    }, FRESH);

    expect(artifact?.content).toHaveProperty('sources', ['fragments/test-setup/setupTests.angular.ts']);
  });
});

describe('the mocking answer', () => {
  /*
   * Last in the join, because the fragments above it may themselves make a request while setting up and the
   * interceptor has to be listening by then.
   */
  it('appends the msw fragment, and only when msw was answered', () => {
    const sourcesFor = (mocking: Answers['mocking']): string[] => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...(mocking === undefined ? {} : { mocking }),
      };
      const [artifact] = testSetupEmitter(answers, FRESH);

      return artifact !== undefined && 'sources' in artifact.content ? artifact.content.sources : [];
    };

    expect(sourcesFor('msw').at(-1)).toBe('fragments/test-setup/setupTests.msw.ts');
    expect(sourcesFor(undefined)).not.toContain('fragments/test-setup/setupTests.msw.ts');
  });
});

// The setup is composed from a target source plus per-answer fragments, so these read the composed text.
describe('the shipped test setup', () => {
  const FRAGMENTS = ['fragments/test-setup/setupTests.router.ts', 'fragments/test-setup/setupTests.tanstackQuery.ts'];

  const setupFor = async (overrides: Partial<Answers>): Promise<string> => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      ...overrides,
    }, FRESH);

    return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
  };

  it.each<TargetId>(['react', 'solid', 'react-native'])(
    'ships the router mocks to %s, which has a binding they could stand in for',
    async (target) => {
      expect(await setupFor({ target })).toContain('export const navigateMock');
    },
  );

  /*
   * Next's router is not a binding a project installs, it is the framework, and what its header reads is
   * `usePathname`. So it stands a different thing in, which is why the record names a fragment rather than
   * setting a flag.
   */
  it('stands in for what next reads instead, which is the pathname', async () => {
    const setup = await setupFor({ target: 'next' });

    expect(setup).toContain('export const pathnameMock');
    expect(setup).toContain("vi.mock('next/navigation'");
    expect(setup).not.toContain('navigateMock');
  });

  it.each<TargetId>(['vue', 'svelte', 'angular', 'webextension'])(
    'ships none to %s, whose framework has none of the three',
    async (target) => {
      expect(await setupFor({ target })).not.toContain('navigateMock');
    },
  );

  // A mock of a package the project never installed costs nothing: the factory runs only on import.
  it('mocks all three bindings at once, since linteljs installs none of them', async () => {
    const setup = await setupFor({ target: 'react' });

    expect(setup).toContain("vi.mock('react-router'");
    expect(setup).toContain("vi.mock('@tanstack/react-router'");
    expect(setup).toContain("vi.mock('@tanstack/solid-router'");
  });

  it('appends the query defaults only when tanstack-query was chosen', async () => {
    expect(await setupFor({})).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      libraries: ['zod'],
      styling: 'tailwind',
    })).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      libraries: [],
      data: 'tanstack-query',
    })).toContain('TEST_QUERY_OPTIONS');
  });

  // Angular and React Native are the two whose setup is not the shared file.
  it.each<TargetId>(['angular', 'react-native'])('appends them on %s too', async (target) => {
    expect(await setupFor({
      target,
      libraries: [],
      data: 'tanstack-query',
    })).toContain('TEST_QUERY_OPTIONS');
  });

  it('keeps the target own setup ahead of both fragments', async () => {
    const setup = await setupFor({
      target: 'react-native',
      libraries: [],
      data: 'tanstack-query',
    });

    expect(setup.indexOf("vi.mock('expo-device'")).toBeLessThan(setup.indexOf('navigateMock'));
    expect(setup.indexOf('navigateMock')).toBeLessThan(setup.indexOf('TEST_QUERY_OPTIONS'));
  });

  // An import in a fragment lands after the statements of the setup it follows.
  it.each(FRAGMENTS)('keeps %s import-free', async (fragment) => {
    const text = await readFile(join(TEMPLATES_ROOT, fragment), 'utf8');

    expect(text).not.toMatch(/^import\s/mu);
  });
});
