import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '@answers';
import { STYLE_ENTRY_CANDIDATES } from '@disk';
import { targetFor } from '@targets';

import { STYLEX_AT_RULE, TAILWIND_IMPORT } from './constants';
import { mergeStyleEntry, styleEntryEmitter } from './styleEntryEmitter';

import type { Artifact } from '@config/types';

const answersFor = (overrides: Partial<Answers>): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

// The merge is a function on the artifact, so the text is read by running it over an absent file.
const contentOf = (artifact: Artifact | undefined): string => {
  return artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '';
};

// Tailwind, so every target writes an entry whatever its starter stylesheets.
const entryPathOf = (target: TargetId, styleEntries: string[]): string | undefined => {
  return styleEntryEmitter(answersFor({
    target,
    styling: 'tailwind',
  }), {
    ...EMPTY_PROJECT,
    styleEntries,
  })[0]?.target;
};

describe('the entry path', () => {
  it("takes the project's own entry over the target's default", () => {
    expect(entryPathOf('webextension', ['src/styles/tailwind.css'])).toBe('src/styles/tailwind.css');
  });

  it('falls back to the target default when the project has none', () => {
    expect(entryPathOf('webextension', [])).toBe('src/style.css');
    expect(entryPathOf('next', [])).toBe('src/app/globals.css');
  });

  // A default missing from the candidates is an entry that can never be found, so a second is written beside it.
  it('can discover every default a target declares', () => {
    const declared = valuesOf(ANSWERS.target.values).map((target) => {
      return targetFor(answersFor({ target })).styleEntry;
    });

    expect(declared.length).toBeGreaterThan(0);
    expect(STYLE_ENTRY_CANDIDATES).toEqual(expect.arrayContaining(declared));
  });

  // A project keeping a `styles/global.css` beside the standard's entry was read as the second of the two.
  it("takes the target's own entry over another the project also has", () => {
    expect(entryPathOf('webextension', ['src/styles/global.css', 'src/style.css'])).toBe('src/style.css');
  });

  it('takes the discovered one when the target default is absent', () => {
    expect(entryPathOf('webextension', ['src/styles/global.css'])).toBe('src/styles/global.css');
  });
});

describe('mergeStyleEntry', () => {
  // Svelte's case: there is no stylesheet on disk, so this is the whole file.
  it('writes the import alone when there is no stylesheet yet', () => {
    expect(mergeStyleEntry(null)).toBe(`${TAILWIND_IMPORT}\n`);
  });

  it('prepends the import to a stylesheet the scaffolder wrote', () => {
    expect(mergeStyleEntry(':root {\n  color: red;\n}\n')).toBe(
      `${TAILWIND_IMPORT}\n\n:root {\n  color: red;\n}\n`,
    );
  });

  // create-next-app --tailwind writes the line itself, so the merge has to be a no-op there.
  it('leaves a stylesheet that already imports tailwind untouched', () => {
    const current = `${TAILWIND_IMPORT}\n\n:root {\n  color: red;\n}\n`;

    expect(mergeStyleEntry(current)).toBe(current);
  });

  it('recognises the other quoting a project may have used', () => {
    const current = "@import 'tailwindcss';\n";

    expect(mergeStyleEntry(current)).toBe(current);
  });

  // Applied twice is applied once: `sync` re-runs this on every project it touches.
  it('is idempotent', () => {
    const once = mergeStyleEntry('body { margin: 0; }\n');

    expect(mergeStyleEntry(once)).toBe(once);
  });
});

// A real entry read `@import url("tailwindcss") source(none)`; unrecognised, a second unrestricted import went in.
describe('an entry that already imports tailwind another way', () => {
  it.each([
    ['the url form', '@import url("tailwindcss");\n'],
    ['the url form with a source restriction', '@import url("tailwindcss") source(none);\n'],
    ['single quotes inside url', "@import url('tailwindcss');\n"],
    ['a space inside url', '@import url( "tailwindcss");\n'],
    ['more than one space', '@import  "tailwindcss";\n'],
    ['a subpath', '@import "tailwindcss/preflight.css";\n'],
  ])('leaves %s alone', (_label, current) => {
    expect(mergeStyleEntry(current)).toBe(current);
  });
});

// NativeWind's entry imports Tailwind by subpath, so the detector has to read those as an import too.
describe('a target with its own import block', () => {
  const NATIVE = ['@import "tailwindcss/theme.css" layer(theme);', '@import "nativewind/theme";'];

  it('writes the block it was given', () => {
    expect(mergeStyleEntry(null, NATIVE)).toBe(`${NATIVE.join('\n')}\n`);
  });

  it('is idempotent on a subpath import', () => {
    const once = mergeStyleEntry('.a { color: red; }\n', NATIVE);

    expect(mergeStyleEntry(once, NATIVE)).toBe(once);
  });
});

describe('the stylesheets a starter ships', () => {
  it('imports each of them from the style entry, never from a component', () => {
    const [artifact] = styleEntryEmitter(answersFor({}), EMPTY_PROJECT);
    const text = contentOf(artifact);

    expect(text).toContain('@import "./styles/tokens.css";');
    expect(text).toContain('@import "./styles/base.css";');
    expect(text).toContain('@import "./components/features/app-header/AppHeader.css";');
    // The theme is Tailwind's, so a project without it imports none.
    expect(text).not.toContain('theme.css');
  });

  // A stylesheet gated on an answer is imported exactly where the answer ships its component.
  it('imports a gated stylesheet only under the answers that ship it', () => {
    const button = '@import "./components/ui/button/Button.css";';

    expect(contentOf(styleEntryEmitter(answersFor({ store: 'zustand' }), EMPTY_PROJECT)[0])).toContain(button);
    expect(contentOf(styleEntryEmitter(answersFor({}), EMPTY_PROJECT)[0])).not.toContain(button);
  });

  // Nothing to import and no utility system: the file would be empty, so it is not written at all.
  it('writes nothing for a target with neither a styling answer nor a starter stylesheet', () => {
    expect(styleEntryEmitter(answersFor({ target: 'react-native' }), EMPTY_PROJECT)).toEqual([]);
  });

  /*
   * `sync` runs this again over a file it already wrote. Each import is added only where it is missing, so a
   * second run adds nothing rather than stacking a second copy of every line.
   */
  it('adds only what is missing, so a second run changes nothing', () => {
    const first = mergeStyleEntry(null, ['@import "./a.css";', '@import "./b.css";']);

    expect(mergeStyleEntry(first, ['@import "./a.css";', '@import "./b.css";'])).toBe(first);
    expect(mergeStyleEntry(first, ['@import "./a.css";', '@import "./c.css";']))
      .toBe(`@import "./c.css";\n\n${first}`);
    expect(mergeStyleEntry('.a {}\n', ['@import "./c.css";', '@import "./d.css";']))
      .toBe('@import "./c.css";\n@import "./d.css";\n\n.a {}\n');
  });
});

describe('the tailwind answer', () => {
  // Tailwind first, so the stylesheets can use it; the theme last, since its `@theme` reads the tokens.
  it('imports tailwind ahead of the stylesheets and the theme after them', () => {
    const lines = contentOf(styleEntryEmitter(answersFor({ styling: 'tailwind' }), EMPTY_PROJECT)[0])
      .trimEnd()
      .split('\n');

    expect(lines[0]).toBe(TAILWIND_IMPORT);
    expect(lines.at(-1)).toBe('@import "./styles/theme.css";');
  });

  // NativeWind reaches Tailwind by subpath and maps no theme file of its own.
  it('takes the block a target names in place of the bare import, and no theme where it names none', () => {
    const text = contentOf(styleEntryEmitter(answersFor({
      target: 'react-native',
      styling: 'tailwind',
    }), EMPTY_PROJECT)[0]);

    // The block alone, and nothing for a theme the target does not name.
    expect(text).toBe([
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/preflight.css" layer(base);',
      '@import "tailwindcss/utilities.css";',
      '@import "nativewind/theme";',
      '',
    ].join('\n'));
  });
});

describe('the styling answer and the component stylesheets', () => {
  /*
   * Under StyleX a component's rules are a `styles.ts` beside it, compiled to atomic classes, and the stylesheet
   * that held them does not ship. An entry that still imported it would fail the build with ENOENT, which is what
   * this pins: measured on a generated project before it was caught here.
   *
   * The tokens and the page styles stay either way. StyleX's own documentation asks for one CSS asset for resets
   * and globals and injects what it compiles into it.
   */
  it('drops a component stylesheet under stylex and keeps the rest', () => {
    const entryFor = (styling: Answers['styling']): string => {
      return contentOf(styleEntryEmitter({
        ...answersFor({ target: 'react' }),
        ...(styling === undefined ? {} : { styling }),
      }, EMPTY_PROJECT)[0]);
    };

    expect(entryFor(undefined)).toContain('app-header/AppHeader.css');
    expect(entryFor('stylex')).not.toContain('app-header/AppHeader.css');
    expect(entryFor('stylex')).toContain('tokens.css');
    expect(entryFor('stylex')).toContain('base.css');
  });

  /*
   * Where StyleX compiles through PostCSS, the at-rule it expands into goes last: what it expands to is rules,
   * and a rule ahead of an `@import` makes that import invalid. Written once, so a `sync` does not repeat it.
   */
  it('appends the stylex at-rule last, and only once', () => {
    const first = mergeStyleEntry(':root {\n  color: red;\n}\n', [], STYLEX_AT_RULE);

    expect(first).toBe(':root {\n  color: red;\n}\n\n@stylex;\n');
    expect(mergeStyleEntry(first, [], STYLEX_AT_RULE)).toBe(first);
    expect(mergeStyleEntry(null, [TAILWIND_IMPORT], STYLEX_AT_RULE))
      .toBe(`${TAILWIND_IMPORT}\n\n@stylex;\n`);
  });

  /*
   * The at-rule is Next's alone, and only under StyleX: it is where the PostCSS plugin writes what it compiled,
   * and on a target whose bundler plugin injects its own it would be an at-rule nothing expands.
   */
  it('carries the stylex at-rule only where stylex compiles through postcss', () => {
    const entryFor = (target: Answers['target']): string => {
      return contentOf(styleEntryEmitter({
        ...answersFor({ target }),
        styling: 'stylex',
      }, EMPTY_PROJECT)[0]);
    };

    expect(entryFor('next')).toContain(STYLEX_AT_RULE);
    expect(entryFor('react')).not.toContain(STYLEX_AT_RULE);
  });
});
