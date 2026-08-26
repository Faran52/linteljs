import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  TARGET_IDS,
  type TargetId,
} from '../../model/answers/answers';

import { buildAliases } from './buildAliases';

interface AnswerOverrides {
  target?: TargetId;
  libraries?: Library[];
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('buildAliases', () => {
  it('builds the default React alias map, ordered as the spine reads top-down', () => {
    expect(buildAliases(answersFor({ target: 'react' }))).toEqual({
      '@components/*': './src/components/*',
      '@ui/*': './src/components/ui/*',
      '@features/*': './src/components/features/*',
      '@lib/*': './src/lib/*',
      '@store/*': './src/lib/store/*',
      '@hooks/*': './src/lib/hooks/*',
      '@utils/*': './src/lib/utils/*',
      '@services/*': './src/lib/services/*',
      '@config/*': './src/config/*',
      '@mocks/*': './__mocks__/*',
    });
  });

  it('renames the hooks alias per target', () => {
    expect(buildAliases(answersFor({ target: 'vue' }))['@composables/*'])
      .toBe('./src/lib/composables/*');
    expect(buildAliases(answersFor({ target: 'vue' }))['@hooks/*']).toBeUndefined();
  });

  it('omits the hooks alias for a target with no hook equivalent', () => {
    expect(buildAliases(answersFor({ target: 'angular' }))['@hooks/*']).toBeUndefined();
    expect(buildAliases(answersFor({ target: 'webextension' }))['@hooks/*']).toBeUndefined();
  });

  it('adds @apis only when Zod is selected', () => {
    expect(buildAliases(answersFor({}))['@apis/*']).toBeUndefined();
    expect(buildAliases(answersFor({ libraries: ['zod'] }))['@apis/*']).toBe('./src/lib/apis/*');
  });

  it('carries the extra aliases only one target has, at the tail of the lib family', () => {
    const next = buildAliases(answersFor({ target: 'next' }));

    expect(next['@server/*']).toBe('./src/lib/server/*');
    expect(next['@content/*']).toBe('./src/content/*');
    expect(buildAliases(answersFor({ target: 'react' }))['@server/*']).toBeUndefined();
  });

  it('omits shared aliases a target does not have', () => {
    const plain = buildAliases(answersFor({ target: 'webextension' }));

    expect(plain['@store/*']).toBeUndefined();
    expect(plain['@model/*']).toBe('./src/lib/model/*');
  });

  /**
   * No template creates `src/lib/providers/`, so the alias named a directory a reader would chase for nothing; it
   * ships on no target rather than being omitted per target.
   */
  it('aliases providers on no target at all', () => {
    for (const target of TARGET_IDS) {
      expect(buildAliases(answersFor({ target }))['@providers/*']).toBeUndefined();
    }
  });

  it('drops @mocks when testing is declined', () => {
    expect(buildAliases({
      ...answersFor({}),
      testing: 'none',
    })['@mocks/*']).toBeUndefined();
  });
});
