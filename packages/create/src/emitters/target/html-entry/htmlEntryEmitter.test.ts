import { hostedAnswersFor } from '@mocks/answersFor';

import { EMPTY_PROJECT } from '@config/constants';

import { emitHtmlEntry, htmlEntryEmitter } from './htmlEntryEmitter';

import type { Answers } from '@config/types';

describe('emitHtmlEntry', () => {
  it('writes the document a bundler serves, titled for the project and loading its entry', () => {
    expect(emitHtmlEntry('my-app', 'src/main.tsx')).toBe([
      '<!doctype html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '    <title>my-app</title>',
      '  </head>',
      '  <body>',
      '    <div id="root"></div>',
      '    <script type="module" src="/src/main.tsx"></script>',
      '  </body>',
      '</html>',
      '',
    ].join('\n'));
  });
});

describe('htmlEntryEmitter', () => {
  it.each<[string, Partial<Answers>, string | undefined]>([
    ['react', { target: 'react' }, 'src/main.tsx'],
    ['react in framework mode', {
      target: 'react',
      router: 'react-router-framework',
    }, undefined],
    ['next', { target: 'next' }, undefined],
    ['vue', { target: 'vue' }, 'src/main.ts'],
    ['nuxt', { target: 'nuxt' }, undefined],
    ['svelte', { target: 'svelte' }, undefined],
    ['solid', { target: 'solid' }, 'src/index.tsx'],
    ['angular', { target: 'angular' }, undefined],
    ['astro', { target: 'astro' }, undefined],
    ['webextension', { target: 'webextension' }, 'src/main.ts'],
    ['react-native', { target: 'react-native' }, undefined],
  ])('writes the document %s serves, loading its own entry', (_label, overrides, entry) => {
    expect(htmlEntryEmitter(hostedAnswersFor(overrides), EMPTY_PROJECT, 'my-app')).toEqual(entry === undefined
      ? []
      : [{
          stage: 'standard',
          target: 'index.html',
          content: { text: emitHtmlEntry('my-app', entry) },
        }]);
  });
});
