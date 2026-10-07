const { config } = await import('@vue/test-utils');
const { i18n } = await import('@i18n/i18n');

// Every suite renders translated text, so each mount installs i18n, in English until a suite switches.
config.global.plugins.push(i18n);
