// AsyncStorage is a native module, so a map stands in; a suite that writes it clears it.
vi.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map<string, string>();

  return {
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
});

// Every suite renders translated text, so each starts with i18n running in English.
// Imported late: a setup fragment that imports React Native statically reaches it untransformed.
beforeAll(async () => {
  const { initI18n } = await import('@i18n');

  initI18n();
});
