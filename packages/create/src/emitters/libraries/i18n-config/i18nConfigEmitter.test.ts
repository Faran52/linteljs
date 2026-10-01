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
    const settings: unknown = JSON.parse(emitInlangSettings(['en', 'ja']));

    expect(svelte.at(1)?.target).toBe('project.inlang/settings.json');
    expect(svelte.at(1)?.seed).toBe(true);
    expect(svelte.at(1)?.content).toEqual({ text: emitInlangSettings(['en', 'ja']) });
    expect(settings).toMatchObject({
      baseLocale: 'en',
      locales: ['en', 'ja'],
      modules: ['./node_modules/@inlang/plugin-message-format/dist/index.js'],
    });
    expect(react).toHaveLength(1);
  });

  it('seeds the config with English first, whatever was chosen', () => {
    const [artifact] = i18nConfigEmitter(answersFor({ languages: ['ja'] }));
    const text = emitI18nConfig(['en', 'ja']);

    expect(artifact?.target).toBe('src/i18n/config.ts');
    expect(artifact?.seed).toBe(true);
    expect(artifact?.stage).toBe('standard');
    expect(artifact?.content).toEqual({ text });
    expect(text.indexOf('id: \'en\'')).toBeLessThan(text.indexOf('id: \'ja\''));
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

    expect(imports).toEqual([
      'import ar from \'./locales/ar/common.json\';',
      'import en from \'./locales/en/common.json\';',
      'import zhTw from \'./locales/zh-TW/common.json\';',
    ]);
    expect(text).toContain('  {\n    id: \'ar\',\n    label: \'العربية\',\n    dir: \'rtl\',\n  },');
    expect(text).toContain('  \'zh-TW\': { common: zhTw },');
    expect(text).toContain('export const languageStorageKey = \'language\';');
    expect(text).toContain('export const fallbackLanguage = \'en\';');
  });

  it('writes the whole module, one block per part', () => {
    const text = emitI18nConfig(['en', 'ar']);

    expect(text).toBe([
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
      '  \'en\': { common: en },',
      '  \'ar\': { common: ar },',
      '};',
      '',
    ].join('\n'));
  });
});
