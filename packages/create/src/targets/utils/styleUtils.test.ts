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
  tailwindThemeFile,
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
    const styles = componentStyles();
    const stylesheetNames = pickedBy(styles, overrides)
      .map((picked) => {
        const nameStart = picked.lastIndexOf('/') + 1;
        const nameEnd = picked.indexOf('.css');
        const stylesheetName = picked.slice(nameStart, nameEnd);
        return stylesheetName;
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
      'src/components/features/app-header/appHeaderStyles.ts base',
      'src/components/ui/mark/markStyles.ts base',
      'src/components/ui/button/buttonStyles.ts base',
    ];
    expect(actual).toEqual(expected);

    const picked = pickedBy(componentStyleModules(), { styling: 'stylex' });

    const stylexModules = [
      'src/components/features/app-header/appHeaderStyles.ts stylex',
      'src/components/ui/mark/markStyles.ts stylex',
      'src/components/ui/button/buttonStyles.ts stylex',
      'src/styles/tokens.stylex.ts stylex',
    ];
    expect(picked).toEqual(stylexModules);
  });

  it('takes another target\'s bytes into its own directories', () => {
    const expected = {
      target: 'src/components/ui/app-mark/appMarkStyles.ts',
      source: 'src/components/ui/mark/markStyles.ts',
      shared: 'solid',
    };
    expect(componentStyleModules('solid', RENAMED)[2]).toMatchObject(expected);

    expect(componentStyleModules()[0]).not.toHaveProperty('shared');
  });

  it('reads React\'s StyleX sheet into Solid\'s tree, spread with attrs', () => {
    const [plain, sheet] = componentStyleModules('solid', RENAMED);
    const expected = {
      target: 'src/components/features/app-header/appHeaderStyles.ts',
      variant: 'stylex',
      shared: 'react',
      stylexAttrs: true,
    };

    expect(sheet).toEqual(expect.objectContaining(expected));
    expect(plain).not.toHaveProperty('stylexAttrs');
  });

  it.each([undefined, 'react'] as const)('spreads the StyleX sheet with props from %s', (from) => {
    const sheet = componentStyleModules(from)[1];

    expect(sheet).not.toHaveProperty('stylexAttrs');
    expect(sheet?.shared).toBe(from);
  });
});

describe('stylexDocument', () => {
  it('writes the base document without stylex and the variant linking its dev CSS with it', () => {
    const plain = pickedBy(stylexDocument('src/layouts/Layout.astro'));
    const stylex = pickedBy(stylexDocument('src/layouts/Layout.astro'), { styling: 'stylex' });

    const expected = ['src/layouts/Layout.astro base'];
    expect(plain).toEqual(expected);
    const stylexLayout = ['src/layouts/Layout.astro stylex'];
    expect(stylex).toEqual(stylexLayout);
  });
});

describe('tailwindThemeFile', () => {
  it('writes the shared theme with tailwind alone', () => {
    const plain = pickedBy([tailwindThemeFile()]);
    const tailwind = pickedBy([tailwindThemeFile()], { styling: 'tailwind' });

    expect(plain).toEqual([]);
    const expected = ['src/styles/theme.css tailwind'];
    expect(tailwind).toEqual(expected);
    const { shared } = tailwindThemeFile();
    expect(shared).toBe(true);
  });
});
