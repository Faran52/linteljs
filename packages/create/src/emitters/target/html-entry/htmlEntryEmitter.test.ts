import { hostedAnswersFor } from '@mocks/answersFor';

import { EMPTY_PROJECT } from '@config/constants';

import { emitHtmlEntry, htmlEntryEmitter } from './htmlEntryEmitter';

import type { Answers } from '@config/types';

describe('emitHtmlEntry', () => {
  it('writes the document a bundler serves, titled for the project and loading its entry', () => {
    const html = emitHtmlEntry('my-app', 'src/main.tsx', false);

    expect(html).toBe([
      '<!doctype html>',
      '<html lang="en">',
      '    <head>',
      '        <meta charset="UTF-8">',
      '        <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '        <title>my-app</title>',
      '    </head>',
      '    <body>',
      '        <div id="root"></div>',
      '        <script type="module" src="/src/main.tsx"></script>',
      '    </body>',
      '</html>',
      '',
    ].join('\n'));
  });

  it('links the favicon only when asked to', () => {
    const html = emitHtmlEntry('my-app', 'src/main.tsx', true);
    const link = [
      '        <link',
      '            rel="icon"',
      '            type="image/svg+xml"',
      '            href="/favicon.svg"',
      '        >',
    ];
    const lines = html.split('\n');

    expect(lines.slice(6, 11)).toEqual(link);
  });
});

describe('htmlEntryEmitter', () => {
  it.each<[string, Partial<Answers>, string | undefined, boolean]>([
    [
      'react',
      { target: 'react' },
      'src/main.tsx',
      true,
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      undefined,
      false,
    ],
    [
      'next',
      { target: 'next' },
      undefined,
      false,
    ],
    [
      'vue',
      { target: 'vue' },
      'src/main.ts',
      true,
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      undefined,
      false,
    ],
    [
      'svelte',
      { target: 'svelte' },
      undefined,
      false,
    ],
    [
      'solid',
      { target: 'solid' },
      'src/index.tsx',
      true,
    ],
    [
      'angular',
      { target: 'angular' },
      undefined,
      false,
    ],
    [
      'astro',
      { target: 'astro' },
      undefined,
      false,
    ],
    [
      'webextension',
      { target: 'webextension' },
      'src/main.ts',
      false,
    ],
    [
      'react-native',
      { target: 'react-native' },
      undefined,
      false,
    ],
  ])('writes the document %s serves, loading its own entry', (_label, overrides, entry, favicon) => {
    const artifacts = htmlEntryEmitter(hostedAnswersFor(overrides), EMPTY_PROJECT, 'my-app');

    expect(artifacts).toEqual(entry === undefined
      ? []
      : [{
          stage: 'standard',
          target: 'index.html',
          content: { text: emitHtmlEntry('my-app', entry, favicon) },
        }]);
  });
});
