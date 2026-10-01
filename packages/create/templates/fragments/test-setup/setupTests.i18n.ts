const { initI18n } = await import('@i18n');

// Every suite renders translated text, so each starts with i18n running and the browser's English.
initI18n();
