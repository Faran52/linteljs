import { config } from '@vue/test-utils';

import { i18n } from '../src/i18n';

// Every suite renders translated text, so each mount installs i18n, in English until a suite switches.
config.global.plugins.push(i18n);
