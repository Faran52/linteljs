import { EMPTY_PROJECT } from '@config/constants';

import { type Answers, DEFAULT_ANSWERS } from '@answers';

import { emitHtmlEntry, htmlEntryEmitter } from './htmlEntryEmitter';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('emitHtmlEntry', () => {
  it('carries the project name into the title, which is why it is written rather than copied', () => {
    expect(emitHtmlEntry('my-app', 'src/main.tsx')).toContain('<title>my-app</title>');
  });

  it('loads the entry the record names, from the root', () => {
    expect(emitHtmlEntry('my-app', 'src/main.tsx'))
      .toContain('<script type="module" src="/src/main.tsx"></script>');
  });

  // An empty one tells a screen reader the language is unknown, which is worse than omitting it.
  it('declares a language rather than an empty one', () => {
    expect(emitHtmlEntry('my-app', 'src/main.tsx')).toContain('<html lang="en">');
  });
});

describe('htmlEntryEmitter', () => {
  it('writes the document for a target that owns its template', () => {
    expect(htmlEntryEmitter(answersFor(), EMPTY_PROJECT, 'my-app').map((artifact) => {
      return artifact.target;
    })).toEqual(['index.html']);
  });

  // react-native rather than any other: it crosses over last, so this stops moving target by target as each one does.
  it('writes nothing for a target with no document of its own', () => {
    expect(htmlEntryEmitter(answersFor({ target: 'react-native' }), EMPTY_PROJECT, 'my-app')).toEqual([]);
  });
});
