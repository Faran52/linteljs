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
} from './styleUtils';

import type { Answers } from '@config/types';

// Vue's spelling: two of the four renamed, so their destinations stop being the asset's own path.
const RENAMED: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/app-mark/AppMark',
  button: 'src/components/ui/app-button/AppButton',
  textInput: 'src/components/ui/text-input/TextInput',
};

describe('componentStyles', () => {
  // Each stylesheet ships exactly when its component does: the button with a store or a form, the input with a form.
  it.each<[string, Partial<Answers>, string[]]>([
    ['no answers', {}, ['AppHeader', 'Mark']],
    ['a store', { store: 'zustand' }, ['AppHeader', 'Mark', 'Button']],
    ['a form', { form: 'tanstack-form' }, ['AppHeader', 'Mark', 'Button', 'TextInput']],
    ['stylex', {
      styling: 'stylex',
      form: 'tanstack-form',
    }, []],
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
  // One module per component in two spellings of one export, and the StyleX tokens with the StyleX one.
  it('writes the class-name module without stylex and the compiled one and its tokens with it', () => {
    expect(pickedBy(componentStyleModules())).toEqual([
      'src/components/features/app-header/styles.ts base',
      'src/components/ui/mark/styles.ts base',
    ]);
    const picked = pickedBy(componentStyleModules(), {
      styling: 'stylex',
      store: 'zustand',
    });

    expect(picked).toEqual([
      'src/components/features/app-header/styles.ts stylex',
      'src/components/ui/mark/styles.ts stylex',
      'src/components/ui/button/styles.ts stylex',
      'src/styles/tokens.stylex.ts stylex',
    ]);
  });

  // `from` names the target whose bytes a module is, and a renamed directory reads the asset from the base one.
  it('takes another target\'s bytes into its own directories', () => {
    expect(componentStyleModules('solid', RENAMED)[2]).toMatchObject({
      target: 'src/components/ui/app-mark/styles.ts',
      source: 'src/components/ui/mark/styles.ts',
      shared: 'solid',
    });
    expect(componentStyleModules()[0]).not.toHaveProperty('shared');
  });
});
