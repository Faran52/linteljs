import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers, DEFAULT_ANSWERS } from '#answers';

import { vueTarget } from './vueTarget';

const destinationsFor = (overrides: Partial<Answers> = {}): string[] => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'vue',
    ...overrides,
  };

  return vueTarget.starterFiles.filter((file) => {
    return file.when === undefined || file.when(answers);
  }).map((file) => {
    return file.target;
  });
};

describe('vueTarget', () => {
  // This target owns its tree, so nothing is fetched and no generator decides what it is born with.

  /*
   * Unconditional, as it was when `create-vue` installed it: a Vue application routes, and this target asks no
   * router question to answer otherwise. So the header links rather than swapping from state, and there is one
   * spelling of it rather than one per router.
   */
  it('routes whatever was answered', () => {
    expect(destinationsFor()).toContain('src/router/index.ts');
    expect(vueTarget.starterFiles.filter((file) => {
      return file.target === 'src/components/features/app-header/AppHeader.vue';
    })).toHaveLength(1);
  });

  it('takes one store module per store it offers, and none without one', () => {
    expect(destinationsFor()).not.toContain('src/lib/store/counter.ts');
    expect(destinationsFor({ store: 'pinia' })).toContain('src/lib/store/counter.ts');
    expect(destinationsFor({ store: 'tanstack-store' })).toContain('src/lib/store/counter.ts');
  });

  // Pinia installs on the app; the other store this target offers is read from a hook and installs nothing.
  it('installs a store plugin only for the store that needs one', () => {
    const installs = (store: Answers['store']): string | undefined => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'vue',
        ...(store === undefined ? {} : { store }),
      };

      return vueTarget.starterFiles.find((file) => {
        return file.target === 'src/lib/providers/installStore.ts'
          && (file.when === undefined || file.when(answers));
      })?.variant;
    };

    expect(installs('pinia')).toBe('pinia');
    expect(installs('tanstack-store')).toBeUndefined();
    expect(installs(undefined)).toBeUndefined();
  });

  // A button is what a store gives the view to press; without one nothing presses anything.
  it('ships a button only where something presses it', () => {
    expect(destinationsFor()).not.toContain('src/components/ui/app-button/AppButton.vue');
    expect(destinationsFor({ store: 'pinia' })).toContain('src/components/ui/app-button/AppButton.vue');
  });

  it('names a single-file component by its own extension', () => {
    expect(vueTarget.sfcExtension).toBe('vue');
  });
});
