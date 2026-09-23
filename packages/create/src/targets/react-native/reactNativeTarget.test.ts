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
   * emitted rather than copied. `eas build` needs a remote account, so `expo export` is what the gate runs, and
   * the two native platforms rather than web: Expo SDK 57's web bundler asks react-native for a module 0.87
   * deleted, and that path ignores the override `metro.config.js` carries.
   */
  it('has its application metadata written rather than copied', () => {
    expect(reactNativeTarget.expoProject).toBe(true);
    expect(reactNativeTarget.build).toBe('expo export --platform ios --platform android');
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
