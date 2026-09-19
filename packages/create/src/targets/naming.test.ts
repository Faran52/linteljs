import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_NAMING, NAMING } from './naming';
import {
  COMPONENT,
  DECLARATION,
  FOLDER,
  FOLDER_ROUTED,
} from './utils/namingUtils';

describe('NAMING', () => {
  it('gives the React family a component rule on .tsx and camelCase modules', () => {
    expect(NAMING.react).toEqual({
      'src/**/*.tsx': COMPONENT,
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
    expect(NAMING.solid).toEqual(NAMING.react);
  });

  // Exempt from the script rule only: `opengraph-image.ts`/`+page.server.ts` are the framework's spelling, not
  // camelCase; the component rule needs none, since `page`/`_layout`/`[slug]` pass a rule that only bans camelCase.
  it('exempts a route directory from the script rule where the framework names one', () => {
    expect(NAMING.next).toEqual({
      'src/**/*.tsx': COMPONENT,
      'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
    expect(NAMING['react-native']).toEqual(NAMING.next);

    expect(NAMING.svelte).toEqual({
      'src/**/*.svelte': COMPONENT,
      'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/!(routes)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
  });

  it('marks a Vue component by its extension and polices nothing about tests', () => {
    expect(NAMING.vue).toEqual({
      'src/**/*.vue': COMPONENT,
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
  });

  // `app.spec.ts` and `app.config.ts` reduce to `app`, already kebab-case, so the one key needs no exclusions.
  // The declaration key is separate because a `.d.ts` this CLI ships is not kebab: `customTypes.d.ts`.
  it('holds Angular to kebab-case, which is what ng generate writes', () => {
    expect(NAMING.angular).toEqual({
      'src/**/*.ts': 'KEBAB_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
  });

  it('exempts a declaration file on every target, Angular included', () => {
    for (const map of Object.values(NAMING)) {
      expect(map['src/**/*.d.ts']).toBe(DECLARATION);
    }
  });

  it('marks an extension component by its directory instead of an extension', () => {
    expect(NAMING.webextension).toEqual({
      'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
      'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/!(components)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
  });
});

describe('FOLDER_NAMING', () => {
  it('permits a router segment only where a router names one', () => {
    const routed = ['react', 'next', 'solid', 'react-native', 'svelte'] as const;
    const plain = ['vue', 'angular', 'webextension'] as const;

    for (const target of routed) {
      expect(FOLDER_NAMING[target]).toEqual({ 'src/**/': FOLDER_ROUTED });
    }
    for (const target of plain) {
      expect(FOLDER_NAMING[target]).toEqual({ 'src/**/': FOLDER });
    }
  });
});
