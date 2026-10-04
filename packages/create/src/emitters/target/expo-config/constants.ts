// iOS designates Chinese by script, so a region code would match no device language.
export const IOS_LOCALES: Readonly<Record<string, string>> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
};
