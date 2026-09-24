import { type Artifact, type Emitter } from '#config/types';
import { targetFor } from '#targets';

import { emitted } from '../../utils/artifactUtils';

/**
 * The document a bundler serves, for a target whose template is this repository's own. It carries the project name
 * in its title, which is the whole reason it is written rather than copied: a starter file is bytes, and this one
 * has to know what the project is called.
 *
 * `lang` is set rather than left empty. An empty one tells a screen reader the language is unknown, which is worse
 * than omitting it, and it is a defect this CLI used to repair in somebody else's template.
 */
export const emitHtmlEntry = (name: string, entry: string): string => {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${name}</title>`,
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    `    <script type="module" src="/${entry}"></script>`,
    '  </body>',
    '</html>',
    '',
  ].join('\n');
};

export const htmlEntryEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { htmlEntry } = targetFor(answers);

  return htmlEntry === undefined ? [] : [emitted('standard', 'index.html', emitHtmlEntry(name, htmlEntry))];
};
