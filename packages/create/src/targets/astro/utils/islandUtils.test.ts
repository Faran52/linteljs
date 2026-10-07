import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { REACT_ISLAND_IMPORT } from '../constants';

import {
  hasIsland,
  islandFiles,
  islandSheets,
  islandTests,
} from './islandUtils';

import type { Answers, HostedFramework } from '@config/types';

const ISLAND_HOSTS: readonly HostedFramework[] = [
  'react',
  'vue',
  'solid',
];

const answersFor = (overrides: Partial<Answers>): Answers => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'astro',
    form: 'tanstack-form',
    ...overrides,
  };

  return answers;
};

// Every axis an island file is gated on, so each gate is asked.
const VARIATIONS: readonly Partial<Answers>[] = [
  {},
  { form: 'react-hook-form' },
  { data: 'tanstack-query' },
  { mocking: 'msw' },
  { languages: ['en', 'ar'] },
  {
    languages: ['en', 'ar'],
    mocking: 'msw',
  },
];

const pickedFor = (overrides: Partial<Answers>): string[] => {
  const picked = VARIATIONS
    .flatMap((variation) => {
      return pickedBy([...islandFiles(), ...islandTests()], {
        form: 'tanstack-form',
        ...variation,
        ...overrides,
      });
    });

  return picked;
};

describe('the contact island', () => {
  it.each<[HostedFramework, string]>([
    ['react', "import { ContactIsland } from '@views/contact/ContactIsland';"],
    ['vue', "import ContactIsland from '@views/contact/ContactIsland.vue';"],
    ['solid', "import { ContactIsland } from '@views/contact/ContactIsland';"],
  ])('imports the %s island on the page that hydrates it', (hostedFramework, line) => {
    const answers = answersFor({ hostedFramework });
    const page = islandFiles()
      .find((file) => {
        return file.target === 'src/pages/contact.astro' && file.when?.(answers) === true;
      });

    const source = page?.transform?.(`${REACT_ISLAND_IMPORT}\n`, answers);

    expect(source).toBe(`${line}\n`);
  });

  it.each(ISLAND_HOSTS)('ships an island hosting %s, under every answer it reads', (hostedFramework) => {
    const islands = pickedFor({ hostedFramework })
      .filter((entry) => {
        return entry.startsWith('src/views/contact/ContactIsland.');
      });

    expect(islands).not.toEqual([]);
  });

  it.each<[string, Partial<Answers>]>([
    ['nothing', {}],
    ['svelte', { hostedFramework: 'svelte' }],
  ])('is not offered hosting %s', (_host, overrides) => {
    const picked = pickedFor(overrides);

    expect(picked).toEqual([]);
  });

  it('is not offered without a form', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'astro',
      hostedFramework: 'react',
    };

    const offered = hasIsland(answers);

    expect(offered).toBe(false);
  });

  it('spreads the solid island stylex sheets through attrs', () => {
    const answers = answersFor({
      hostedFramework: 'solid',
      styling: 'stylex',
    });
    const attrs = islandFiles()
      .filter(({
        when,
        variant,
        stylexAttrs,
      }) => {
        return variant === 'stylex' && stylexAttrs === true && when?.(answers) !== false;
      })
      .map(({ target }) => {
        return target;
      });

    const expected = ['src/components/ui/button/buttonStyles.ts', 'src/components/ui/text-input/textInputStyles.ts'];

    expect(attrs).toEqual(expected);
  });

  it('styles each island under its own host only', () => {
    const answers = answersFor({ hostedFramework: 'vue' });
    const sheets = islandSheets()
      .filter(({ when }) => {
        return when(answers);
      })
      .map(({ path }) => {
        return path;
      });

    const expected = ['../components/ui/app-button/AppButton.css', '../components/ui/text-input/TextInput.css'];

    expect(sheets).toEqual(expected);
  });
});
