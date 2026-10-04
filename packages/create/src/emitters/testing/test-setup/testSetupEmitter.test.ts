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

const FRESH: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

describe('testSetupEmitter', () => {
  it('writes nothing for a project that asked for no tests', () => {
    const artifacts = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      testing: 'none',
    }, FRESH);

    expect(artifacts).toEqual([]);
  });

  it('joins the target setup and its router mocks into the spelling React needs', () => {
    const testSetup = testSetupEmitter(DEFAULT_ANSWERS, FRESH);
    const expected = [{
      stage: 'standard',
      target: '__mocks__/setupTests.tsx',
      content: {
        sources: [
          'fragments/test-setup/setupTests.ts',
          'fragments/test-setup/setupTests.router.ts',
        ],
      },
      preserve: true,
    }];
    expect(testSetup).toEqual(expected);
  });

  it('appends the fragment a selected library brings', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      libraries: [],
      data: 'tanstack-query',
    }, FRESH);

    const expected = [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
      'fragments/test-setup/setupTests.tanstackQuery.ts',
    ];
    expect(artifact?.content).toHaveProperty('sources', expected);
  });

  it('initialises i18n where the target translates, and nowhere else', () => {
    const [react] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      languages: ['ar'],
    }, FRESH);
    const [vue] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'vue',
      languages: ['ar'],
    }, FRESH);

    const expected = [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
      'fragments/test-setup/setupTests.i18n.ts',
    ];
    expect(react?.content).toHaveProperty('sources', expected);

    const i18nSetup = ['fragments/test-setup/setupTests.i18n.ts'];

    expect(vue?.content).toHaveProperty('sources', expect.not.arrayContaining(i18nSetup));
  });

  it('adds nothing for a language on an extension with no popup to translate', () => {
    const [translated] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      surfaces: ['background'],
      languages: ['ar'],
    }, FRESH);

    const expected = ['fragments/test-setup/setupTests.ts'];
    expect(translated?.content).toHaveProperty('sources', expected);
  });

  it('adds nothing for a target whose suites wrap their own provider', () => {
    const [next] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'next',
      languages: ['ar'],
    }, FRESH);

    const expected = [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.nextRouter.ts',
    ];
    expect(next?.content).toHaveProperty('sources', expected);
  });

  it('leads with the target setup where the target ships one', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'angular',
    }, FRESH);

    const expected = ['fragments/test-setup/setupTests.angular.ts'];
    expect(artifact?.content).toHaveProperty('sources', expected);
  });
});

describe('the mocking answer', () => {
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

    const actual = sourcesFor('msw').at(-1);
    expect(actual).toBe('fragments/test-setup/setupTests.msw.ts');
    const undefinedSources = sourcesFor(undefined);
    expect(undefinedSources).not.toContain('fragments/test-setup/setupTests.msw.ts');
  });
});

describe('the shipped test setup', () => {
  const FRAGMENTS = ['fragments/test-setup/setupTests.router.ts', 'fragments/test-setup/setupTests.tanstackQuery.ts'];

  const setupFor = async (overrides: Partial<Answers>): Promise<string> => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      ...overrides,
    }, FRESH);

    if (artifact === undefined) {
      return '';
    }

    return shippedAssetsReader(artifact.content);
  };

  it.each<TargetId>([
    'react',
    'solid',
  ])(
    'ships the router mocks to %s, which has a binding they could stand in for',
    async (target) => {
      const setup = await setupFor({ target });
      expect(setup).toContain('export const navigateMock');
    },
  );

  it('stands in for what next reads instead, which is the pathname', async () => {
    const setup = await setupFor({ target: 'next' });

    expect(setup).toContain('export const pathnameMock');
    expect(setup).toContain("vi.mock('next/navigation'");
    expect(setup).not.toContain('navigateMock');
  });

  it.each<TargetId>([
    'vue',
    'svelte',
    'angular',
    'webextension',
    'react-native',
  ])(
    'ships none to %s, which installs none of the three',
    async (target) => {
      const setup = await setupFor({ target });
      expect(setup).not.toContain('navigateMock');
    },
  );

  it('mocks all three bindings at once, since linteljs installs none of them', async () => {
    const setup = await setupFor({ target: 'react' });

    expect(setup).toContain("vi.mock('react-router'");
    expect(setup).toContain("vi.mock('@tanstack/react-router'");
    expect(setup).toContain("vi.mock('@tanstack/solid-router'");
  });

  it('appends the query defaults only when tanstack-query was chosen', async () => {
    const setup = await setupFor({});
    expect(setup).not.toContain('TEST_QUERY_OPTIONS');

    const withoutQuery = await setupFor({
      libraries: ['zod'],
      styling: 'tailwind',
    });

    expect(withoutQuery).not.toContain('TEST_QUERY_OPTIONS');

    const withQuery = await setupFor({
      libraries: [],
      data: 'tanstack-query',
    });

    expect(withQuery).toContain('TEST_QUERY_OPTIONS');
  });

  it.each<TargetId>(['angular', 'react-native'])('appends them on %s too', async (target) => {
    const setup = await setupFor({
      target,
      libraries: [],
      data: 'tanstack-query',
    });

    expect(setup).toContain('TEST_QUERY_OPTIONS');
  });

  it('keeps the target own setup ahead of both fragments', async () => {
    const setup = await setupFor({
      target: 'react-native',
      libraries: [],
      data: 'tanstack-query',
    });

    const index = setup.indexOf("'react-native-reanimated'");
    expect(index).toBeGreaterThan(-1);
    expect(index).toBeLessThan(setup.indexOf('TEST_QUERY_OPTIONS'));
  });

  it.each(FRAGMENTS)('keeps %s import-free', async (fragment) => {
    const text = await readFile(join(TEMPLATES_ROOT, fragment), 'utf8');

    expect(text).not.toMatch(/^import\s/mu);
  });
});
