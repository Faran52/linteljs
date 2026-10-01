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
    expect(componentStyles(RENAMED)[1]).toMatchObject({
      target: 'src/components/ui/app-mark/AppMark.css',
      source: 'src/components/ui/mark/Mark.css',
      shared: true,
    });

    expect(componentStyles()[1]).not.toHaveProperty('source');
  });
});

describe('componentStyleModules', () => {
  it('writes the class-name module without stylex and the compiled one and its tokens with it', () => {
    expect(pickedBy(componentStyleModules())).toEqual([
      'src/components/features/app-header/styles.ts base',
      'src/components/ui/mark/styles.ts base',
      'src/components/ui/button/styles.ts base',
    ]);

    const picked = pickedBy(componentStyleModules(), { styling: 'stylex' });

    expect(picked).toEqual([
      'src/components/features/app-header/styles.ts stylex',
      'src/components/ui/mark/styles.ts stylex',
      'src/components/ui/button/styles.ts stylex',
      'src/styles/tokens.stylex.ts stylex',
    ]);
  });

  it('takes another target\'s bytes into its own directories', () => {
    expect(componentStyleModules('solid', RENAMED)[2]).toMatchObject({
      target: 'src/components/ui/app-mark/styles.ts',
      source: 'src/components/ui/mark/styles.ts',
      shared: 'solid',
    });

    expect(componentStyleModules()[0]).not.toHaveProperty('shared');
  });
});

describe('stylexDocument', () => {
  it('writes the base document without stylex and the variant linking its dev CSS with it', () => {
    const plain = pickedBy(stylexDocument('src/layouts/Layout.astro'));
    const stylex = pickedBy(stylexDocument('src/layouts/Layout.astro'), { styling: 'stylex' });

    expect(plain).toEqual(['src/layouts/Layout.astro base']);
    expect(stylex).toEqual(['src/layouts/Layout.astro stylex']);
  });
});
