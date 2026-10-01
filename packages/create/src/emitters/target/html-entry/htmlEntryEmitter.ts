import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// `lang` set: an empty one tells a screen reader the language is unknown. Laid out as the html layer formats it.
export const emitHtmlEntry = (name: string, entry: string, favicon: boolean): string => {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '    <head>',
    '        <meta charset="UTF-8">',
    '        <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `        <title>${name}</title>`,
    ...favicon
      ? [
          '        <link',
          '            rel="icon"',
          '            type="image/svg+xml"',
          '            href="/favicon.svg"',
          '        >',
        ]
      : [],
    '    </head>',
    '    <body>',
    '        <div id="root"></div>',
    `        <script type="module" src="/${entry}"></script>`,
    '    </body>',
    '</html>',
    '',
  ].join('\n');
};

export const htmlEntryEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { htmlEntry, publicDirectory } = targetFor(answers);
  // A web extension's popup has no tab to put an icon on, and no public directory to serve one from.
  const favicon = publicDirectory !== undefined;

  return htmlEntry === undefined ? [] : [emitted('standard', 'index.html', emitHtmlEntry(name, htmlEntry, favicon))];
};
