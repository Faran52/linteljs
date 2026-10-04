import { answersFor } from '@mocks/answersFor';

import {
  emitI18nConfig,
  emitInlangSettings,
  i18nConfigEmitter,
} from './i18nConfigEmitter';

describe('i18nConfigEmitter', () => {
  it('writes nothing when no language was chosen', () => {
    const artifacts = i18nConfigEmitter(answersFor({}));

    expect(artifacts).toEqual([]);
  });

  it('seeds the inlang project beside the config only on a target that compiles its catalog', () => {
    const svelte = i18nConfigEmitter(answersFor({
      target: 'svelte',
      languages: ['ja'],
    }));
    const react = i18nConfigEmitter(answersFor({ languages: ['ja'] }));
    const solid = i18nConfigEmitter(answersFor({
      target: 'solid',
      languages: ['ja'],
    }));
    const settings: unknown = JSON.parse(emitInlangSettings(['en', 'ja']));

    expect(svelte.at(1)?.target).toBe('project.inlang/settings.json');
    expect(svelte.at(1)?.seed).toBe(true);
    const expectedContent = { text: emitInlangSettings(['en', 'ja']) };
    expect(svelte.at(1)?.content).toEqual(expectedContent);

    const expectedSettings = {
      '$schema': 'https://inlang.com/schema/project-settings',
      'baseLocale': 'en',
      'locales': ['en', 'ja'],
      'modules': ['./node_modules/@inlang/plugin-message-format/dist/index.js'],
      'plugin.inlang.messageFormat': { pathPattern: './src/i18n/locales/{locale}/common.json' },
    };
    expect(settings).toEqual(expectedSettings);

    expect(react).toHaveLength(1);
    expect(solid).toHaveLength(1);
  });

  it('writes the config alone for a language that slipped past the answers onto a target with no i18n', () => {
    const background = i18nConfigEmitter(answersFor({
      target: 'webextension',
      surfaces: ['background'],
      languages: ['ja'],
    }));
    const targets = background
      .map((artifact) => {
        return artifact.target;
      });

    const expected = ['src/i18n/config.ts'];
    expect(targets).toEqual(expected);
  });

  it('names each language in its own script, and its direction', () => {
    const text = emitI18nConfig([
      'ja',
      'ko',
      'zh-CN',
      'zh-TW',
    ]);
    const named = text
      .split('\n')
      .filter((line) => {
        return /^ {4}(?:label|dir):/u.test(line);
      });

    const expected = [
      '    label: \'日本語\',',
      '    dir: \'ltr\',',
      '    label: \'한국어\',',
      '    dir: \'ltr\',',
      '    label: \'简体中文\',',
      '    dir: \'ltr\',',
      '    label: \'繁體中文\',',
      '    dir: \'ltr\',',
    ];
    expect(named).toEqual(expected);
  });

  it('seeds the config with English first, whatever was chosen', () => {
    const [artifact] = i18nConfigEmitter(answersFor({ languages: ['ja'] }));
    const text = emitI18nConfig(['en', 'ja']);

    expect(artifact?.target).toBe('src/i18n/config.ts');
    expect(artifact?.seed).toBe(true);
    expect(artifact?.stage).toBe('standard');
    const expected = { text };
    expect(artifact?.content).toEqual(expected);
    const index = text.indexOf('id: \'en\'');
    expect(index).toBeLessThan(text.indexOf('id: \'ja\''));
  });

  it('imports each locale under a sorted, valid name and marks Arabic right to left', () => {
    const text = emitI18nConfig([
      'en',
      'zh-TW',
      'ar',
    ]);
    const imports = text
      .split('\n')
      .filter((line) => {
        return line.startsWith('import');
      });

    const expected = [
      'import ar from \'./locales/ar/common.json\';',
      'import en from \'./locales/en/common.json\';',
      'import zhTw from \'./locales/zh-TW/common.json\';',
    ];
    expect(imports).toEqual(expected);

    expect(text).toContain('  {\n    id: \'ar\',\n    label: \'العربية\',\n    dir: \'rtl\',\n  },');
    expect(text).toContain('  \'zh-TW\': { common: zhTw },');
    expect(text).toContain('  \'ar\': { common: ar },');
    expect(text).toContain('export const languageStorageKey = \'language\';');
    expect(text).toContain('export const fallbackLanguage = \'en\';');
  });

  it('writes the whole module, one block per part', () => {
    const text = emitI18nConfig(['en', 'ar']);

    const expected = [
      'import ar from \'./locales/ar/common.json\';',
      'import en from \'./locales/en/common.json\';',
      '',
      'export const fallbackLanguage = \'en\';',
      '',
      '// Written by the language switcher alone: a detected language is never stored.',
      'export const languageStorageKey = \'language\';',
      '',
      'export const languages = [',
      '  {',
      '    id: \'en\',',
      '    label: \'English\',',
      '    dir: \'ltr\',',
      '  },',
      '  {',
      '    id: \'ar\',',
      '    label: \'العربية\',',
      '    dir: \'rtl\',',
      '  },',
      '] as const;',
      '',
      'export const resources = {',
      '  en: { common: en },',
      '  ar: { common: ar },',
      '};',
      '',
      '// The tag, then each shorter prefix of it: `zh-TW-x-hk` reads as `zh-TW`, then `zh`.',
      'export const lookupTags = (tag: string): string[] => {',
      '  // iOS names Chinese by script, `zh-Hans-CN`: the script stands for the region the codes carry.',
      '  const subtags = tag',
      '    .replace(/^zh-hans\\b/iu, \'zh-CN\')',
      '    .replace(/^zh-hant\\b/iu, \'zh-TW\')',
      '    .split(\'-\');',
      '',
      '  return subtags',
      '    .map((_subtag, index) => {',
      '      const kept = subtags.slice(0, subtags.length - index);',
      '',
      '      return kept.join(\'-\');',
      '    });',
      '};',
      '',
    ].join('\n');
    expect(text).toBe(expected);
  });
});
