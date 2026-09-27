import {
  byKey,
  componentStyleGates,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  PRESSABLE,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_STORE,
  WITHOUT_FORM,
  WITHOUT_STORE,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { vueTarget } from './vueTarget';

import type { Answers } from '@config/types';

const destinationsFor = (overrides: Partial<Answers> = {}): string[] => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'vue',
    ...overrides,
  };

  return vueTarget.starterFiles
    .filter((file) => {
      return file.when === undefined || file.when(answers);
    })
    .map((file) => {
      return file.target;
    });
};

describe('vueTarget', () => {
  /*
   * Unconditional: a Vue application routes, and this target asks no router question to answer otherwise. So the
   * header links rather than swapping from state, and there is one spelling of it rather than one per router.
   */
  it('routes whatever was answered', () => {
    expect(destinationsFor()).toContain('src/router/index.ts');

    const headers = vueTarget.starterFiles
      .filter((file) => {
        return file.target === 'src/components/features/app-header/AppHeader.vue';
      });

    expect(headers).toHaveLength(1);
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

      return vueTarget.starterFiles
        .find((file) => {
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

// Every gated entry and the answers that write it, read off what the entry is for rather than off its gate.
const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('app-mark/AppMark', 'app-button/AppButton', true),
  ...contactGates(['tanstack-query']),
  ['src/views/routes.ts', WITHOUT_FORM],
  ['src/views/routes.ts@with-form', WITH_FORM],
  ['src/views/HomeView.vue', WITHOUT_STORE],
  ['src/views/HomeView.vue@with-store', WITH_STORE],
  ['src/views/ContactView.vue', WITH_FORM],
  ['src/views/useContactForm.ts', WITH_FORM],
  ['src/components/ui/app-button/AppButton.vue', PRESSABLE],
  ['src/components/ui/text-input/TextInput.vue', WITH_FORM],
  ['src/components/ui/text-input/types.ts', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/installData.ts', NOT_TANSTACK_QUERY],
  ['src/lib/providers/installData.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/installStore.ts', [{ store: [undefined, 'tanstack-store'] }]],
  ['src/lib/providers/installStore.ts@pinia', [{ store: ['pinia'] }]],
  ['src/lib/store/counter.ts@pinia', [{ store: ['pinia'] }]],
  ['src/lib/store/counter.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['../components/ui/app-button/AppButton.css', PRESSABLE],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

// `starterSourceEmitter` refuses two spellings of one destination, and each gate is held to what it is for.
describe('the starter gates', () => {
  const walk = walkGates(() => {
    return vueTarget;
  }, 'vue');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});
