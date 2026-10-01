import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import type { TargetId } from '@config/types';

export const AGENTS = valuesOf(ANSWERS.agents.values);
export const BROWSERS = valuesOf(ANSWERS.browser.values);
export const DATA_CHOICES = valuesOf(ANSWERS.data.values);
export const FORMS = valuesOf(ANSWERS.form.values);
export const HOSTED_FRAMEWORKS = valuesOf(ANSWERS.hostedFramework.values);
export const LANGUAGES = valuesOf(ANSWERS.languages.values);
export const MOCKING_CHOICES = valuesOf(ANSWERS.mocking.values);
export const LIBRARIES = valuesOf(ANSWERS.libraries.values);
export const PACKAGE_MANAGERS = valuesOf(ANSWERS.packageManager.values);
export const PLUGINS = valuesOf(ANSWERS.plugins.values);
export const STYLING_CHOICES = valuesOf(ANSWERS.styling.values);
export const SURFACES = valuesOf(ANSWERS.surfaces.values);
export const TESTING_CHOICES = valuesOf(ANSWERS.testing.values);

// No browser pass: an extension's pages are not served, and React Native's web build is not what ships.
export const NO_BROWSER_PASS: ReadonlySet<TargetId> = new Set(['webextension', 'react-native']);
