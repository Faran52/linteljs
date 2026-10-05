import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import type { TargetId } from '@config/types';

export const AGENTS = keysOf(ANSWERS.agents.values);
export const BROWSERS = keysOf(ANSWERS.browser.values);
export const DATA_CHOICES = keysOf(ANSWERS.data.values);
export const FORMS = keysOf(ANSWERS.form.values);
export const HOSTED_FRAMEWORKS = keysOf(ANSWERS.hostedFramework.values);
export const LANGUAGES = keysOf(ANSWERS.languages.values);
export const MOCKING_CHOICES = keysOf(ANSWERS.mocking.values);
export const LIBRARIES = keysOf(ANSWERS.libraries.values);
export const PACKAGE_MANAGERS = keysOf(ANSWERS.packageManager.values);
export const PLUGINS = keysOf(ANSWERS.plugins.values);
export const STYLING_CHOICES = keysOf(ANSWERS.styling.values);
export const SURFACES = keysOf(ANSWERS.surfaces.values);
export const TESTING_CHOICES = keysOf(ANSWERS.testing.values);

// No browser pass: an extension's pages are not served, and React Native's web build is not what ships.
export const NO_BROWSER_PASS: ReadonlySet<TargetId> = new Set(['webextension', 'react-native']);
