import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

export const AGENTS = valuesOf(ANSWERS.agents.values);
export const BROWSERS = valuesOf(ANSWERS.browser.values);
export const DATA_CHOICES = valuesOf(ANSWERS.data.values);
export const FORMS = valuesOf(ANSWERS.form.values);
export const HOSTED_FRAMEWORKS = valuesOf(ANSWERS.hostedFramework.values);
export const LANGUAGES = valuesOf(ANSWERS.languages.values);
export const LIBRARIES = valuesOf(ANSWERS.libraries.values);
export const PACKAGE_MANAGERS = valuesOf(ANSWERS.packageManager.values);
export const PLUGINS = valuesOf(ANSWERS.plugins.values);
export const STYLING_CHOICES = valuesOf(ANSWERS.styling.values);
export const SURFACES = valuesOf(ANSWERS.surfaces.values);
export const TESTING_CHOICES = valuesOf(ANSWERS.testing.values);
export const TYPE_SAFETY_CHOICES = valuesOf(ANSWERS.typeSafety.values);
