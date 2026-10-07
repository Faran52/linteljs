// AsyncStorage is a native module, so a map stands in; a suite that writes it clears it.
jest.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map<string, string>();

  const asyncStorage = {
    __esModule: true,
    default: {
      getItem: (key: string): Promise<string | null> => {
        return Promise.resolve(items.get(key) ?? null);
      },
      setItem: (key: string, value: string): Promise<void> => {
        items.set(key, value);

        return Promise.resolve();
      },
      clear: (): Promise<void> => {
        items.clear();

        return Promise.resolve();
      },
    },
  };

  return asyncStorage;
});

// expo-localization is a native module; the device prefers English unless a suite says otherwise.
jest.mock('expo-localization', () => {
  const localization = {
    getLocales: jest.fn(() => {
      const english = [{ languageTag: 'en-US' }];

      return english;
    }),
  };

  return localization;
});

// Every suite renders translated text, so each starts with i18n running in English.
beforeAll(() => {
  const { initI18n } = jest.requireActual<typeof import('@i18n/i18n')>('@i18n/i18n');

  initI18n();
});
