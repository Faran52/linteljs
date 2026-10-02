import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type ComponentPaths,
  componentStyleModules,
  componentStyles,
  stylexDocument,
} from './styleUtils';

import type { Answers } from '@config/types';

const RENAMED: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/app-mark/AppMark',
  button: 'src/components/ui/app-button/AppButton',
  textInput: 'src/components/ui/text-input/TextInput',
};

describe('componentStyles', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    [
      'no answers',
      {},
      [
        'AppHeader',
        'Mark',
        'Button',
      ],
    ],
    [
      'a form',
      { form: 'tanstack-form' },
      [
        'AppHeader',
        'Mark',
        'Button',
        'TextInput',
      ],
    ],
    [
      'stylex',
      {
        styling: 'stylex',
        form: 'tanstack-form',
      },
      [],
    ],
  ])('ships the stylesheets of the components written under %s', (_case, overrides, components) => {
    const stylesheetNames = pickedBy(componentStyles(), overrides)
      .map((picked) => {
        return picked.slice(picked.lastIndexOf('/') + 1, picked.indexOf('.css'));
      });

    expect(stylesheetNames).toEqual(components);
  });

  it('reads a renamed component from the shared asset under its own name', () => {
    const expected = {
      target: 'src/components/ui/app-mark/AppMark.css',
      source: 'src/components/ui/mark/Mark.css',
      shared: true,
    };
    expect(componentStyles(RENAMED)[1]).toMatchObject(expected);

    expect(componentStyles()[1]).not.toHaveProperty('source');
  });
});

describe('componentStyleModules', () => {
  it('writes the class-name module without stylex and the compiled one and its tokens with it', () => {
    const actual = pickedBy(componentStyleModules());
    const expected = [
      'src/components/features/app-header/styles.ts base',
      'src/components/ui/mark/styles.ts base',
      'src/components/ui/button/styles.ts base',
    ];
    expect(actual).toEqual(expected);

    const picked = pickedBy(componentStyleModules(), { styling: 'stylex' });

    const expected2 = [
      'src/components/features/app-header/styles.ts stylex',
      'src/components/ui/mark/styles.ts stylex',
      'src/components/ui/button/styles.ts stylex',
      'src/styles/tokens.stylex.ts stylex',
    ];
    expect(picked).toEqual(expected2);
  });

  it('takes another target\'s bytes into its own directories', () => {
    const expected = {
      target: 'src/components/ui/app-mark/styles.ts',
      source: 'src/components/ui/mark/styles.ts',
      shared: 'solid',
    };
    expect(componentStyleModules('solid', RENAMED)[2]).toMatchObject(expected);

    expect(componentStyleModules()[0]).not.toHaveProperty('shared');
  });
});

describe('stylexDocument', () => {
  it('writes the base document without stylex and the variant linking its dev CSS with it', () => {
    const plain = pickedBy(stylexDocument('src/layouts/Layout.astro'));
    const stylex = pickedBy(stylexDocument('src/layouts/Layout.astro'), { styling: 'stylex' });

    const expected = ['src/layouts/Layout.astro base'];
    expect(plain).toEqual(expected);
    const expected2 = ['src/layouts/Layout.astro stylex'];
    expect(stylex).toEqual(expected2);
  });
});
