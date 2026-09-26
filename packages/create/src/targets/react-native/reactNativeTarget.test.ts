import {
  byKey,
  type GateRow,
  mswGates,
  RTK_QUERY,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { reactNativeTarget } from './reactNativeTarget';

describe('reactNativeTarget', () => {
  it('is the record the react-native answer names', () => {
    expect(reactNativeTarget.id).toBe('react-native');
  });

  /*
   * Expo reads its application metadata from `app.json`, three of whose fields are the project's name, so it is
   * emitted rather than copied. `eas build` needs a remote account, so `expo export` of every platform is what
   * the gate runs.
   */
  it('has its application metadata written rather than copied', () => {
    expect(reactNativeTarget.expoProject).toBe(true);
    expect(reactNativeTarget.build).toBe('expo export');
  });

  /*
   * A runner of its own: React Native resolves a module the way Metro does and renders through a test renderer
   * rather than a DOM, so neither the transform nor the environment every other target uses applies.
   */
  it('runs its suite the way Metro resolves', () => {
    const [platform] = reactNativeTarget.testPlatforms ?? [];

    expect(platform?.name).toBe('native');
    expect(platform?.extensions[0]).toBe('.ios.tsx');
  });

  // `src/app` stays exempt from the component glob: expo-router resolves a route by its filename.
  it('names files the way any JSX target does, less the route root', () => {
    expect(reactNativeTarget.naming).toEqual(componentNaming('app'));
    expect(reactNativeTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

// Every gated entry and the answers that write it, read off what the entry is for rather than off its gate.
const GATES: GateRow[] = [
  // No dev server to serve a worker from, so no browser half.
  ...mswGates(false, false),
  // The render helper every screen suite takes, so only a project with tests has one.
  ['__mocks__/renderScreen.tsx', [{ testing: ['vitest'] }]],
  // NativeWind is wired through Metro and its own type stub, and the layout imports its stylesheet.
  ['metro.config.js@tailwind', TAILWIND],
  ['nativewind-env.d.ts@tailwind', TAILWIND],
  ['src/app/_layout.tsx', [{ styling: [undefined, 'stylex'] }]],
  ['src/app/_layout.tsx@tailwind', TAILWIND],
  ['src/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/apis/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/apis/baseApi.test.ts@rtk-query', RTK_QUERY],
];

// `starterSourceEmitter` refuses two spellings of one destination, and each gate is held to what it is for.
describe('the starter gates', () => {
  const walk = walkGates(() => {
    return reactNativeTarget;
  }, 'react-native');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});
