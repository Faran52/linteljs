import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type Condition,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  PRESSABLE,
  RTK_QUERY,
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

import { COMPONENT } from '../constants';

import { reactTarget } from './reactTarget';

import type { Answers } from '@config/types';

const recordFor = (overrides: Partial<Answers> = {}): ReturnType<typeof reactTarget> => {
  return reactTarget({
    ...DEFAULT_ANSWERS,
    target: 'react',
    ...overrides,
  });
};

describe('reactTarget', () => {
  it('is the record the react answer names', () => {
    expect(recordFor().id).toBe('react');
  });

  it('hands framework mode the build, and takes its document away', () => {
    const framework = recordFor({ router: 'react-router-framework' });

    expect(framework.build).toBe('react-router build');
    expect(framework.typecheck).toBe('react-router typegen && tsc --noEmit');
    expect(framework.htmlEntry).toBeUndefined();
    expect(recordFor({ router: 'react-router' }).htmlEntry).toBe('src/main.tsx');
  });

  it('installs the compiler only where react() builds', () => {
    expect(recordFor().devDependencies).toContain('oxc-transform-react');
    expect(recordFor({ router: 'react-router-framework' }).devDependencies).not.toContain('oxc-transform-react');
    expect(recordFor({ router: 'react-router-framework' }).devDependencies).toContain('@vitejs/plugin-react');
  });

  it('ships one entry, and an App per router it offers plus one for no router', () => {
    const mains = recordFor().starterFiles
      .filter((file) => {
        return file.target === 'src/main.tsx';
      });

    expect(mains).toHaveLength(1);

    const appVariants = recordFor().starterFiles
      .filter((file) => {
        return file.target === 'src/App.tsx';
      })
      .map((file) => {
        return file.variant;
      });

    expect(appVariants).toEqual([undefined, 'react-router', 'tanstack-router']);
  });

  it('ships the mocking layer only when msw was answered, and picks the handlers by whether a form was', () => {
    const sourcesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      return Object.fromEntries(recordFor(overrides).starterFiles
        .filter((file) => {
          return file.when === undefined || file.when(answers);
        })
        .map((file) => {
          return [file.target, file.variant];
        }));
    };

    expect(sourcesFor({})).not.toHaveProperty('__mocks__/msw/handlers.ts');
    expect(sourcesFor({ mocking: 'msw' })).toHaveProperty('src/lib/utils/fetchExtendedUtils.ts');
    expect(sourcesFor({ mocking: 'msw' })['__mocks__/msw/handlers.ts']).toBeUndefined();

    const source = sourcesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.ts'];

    expect(source).toBe('with-form');
  });

  it('picks the handler suite the same way the handlers are picked', () => {
    const suitesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      return Object.fromEntries(recordFor(overrides).starterTests
        .filter((test) => {
          return test.when === undefined || test.when(answers);
        })
        .map((test) => {
          return [test.target, test.variant];
        }));
    };

    expect(suitesFor({})).not.toHaveProperty('__mocks__/msw/handlers.test.ts');
    expect(suitesFor({ mocking: 'msw' })['__mocks__/msw/handlers.test.ts']).toBeUndefined();
    expect(suitesFor({ mocking: 'msw' })).toHaveProperty('src/lib/utils/fetchExtendedUtils.test.ts');

    const suite = suitesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.test.ts'];

    expect(suite).toBe('with-form');
  });

  it('marks a .tsx file a component wherever it sits', () => {
    expect(recordFor().naming['src/**/*.tsx']).toBe(COMPONENT);
  });
});

const NO_ROUTER: readonly Condition[] = [{ router: [undefined] }];
const FRAMEWORK_MODE: readonly Condition[] = [{ router: ['react-router-framework'] }];

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ['src/main.tsx', [{ router: [undefined, 'react-router', 'tanstack-router'] }]],
  ['src/App.tsx', NO_ROUTER],
  ['src/App.tsx@react-router', [{ router: ['react-router'] }]],
  ['src/App.tsx@tanstack-router', [{ router: ['tanstack-router'] }]],
  ['src/components/features/app-header/AppHeader.tsx', NO_ROUTER],
  [
    'src/components/features/app-header/AppHeader.tsx@react-router',
    [{ router: ['react-router', 'react-router-framework'] }],
  ],
  ['src/components/features/app-header/AppHeader.tsx@tanstack-router', [{ router: ['tanstack-router'] }]],
  ['src/routes/router.tsx@react-router', [{ router: ['react-router'] }]],
  ['src/root.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes.ts@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/home.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/about.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/version.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/pages/routes.tsx', WITHOUT_FORM],
  ['src/pages/routes.tsx@with-form', WITH_FORM],
  ['src/pages/home/HomePage.tsx', WITHOUT_STORE],
  ['src/pages/home/HomePage.tsx@with-store', WITH_STORE],
  ['src/components/ui/index.ts', [{
    store: [undefined],
    form: [undefined],
  }]],
  ['src/components/ui/index.ts@with-store', [{
    store: ANSWERED,
    form: [undefined],
  }]],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/button/Button.tsx', PRESSABLE],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/pages/contact/ContactPage.tsx', WITH_FORM],
  ['src/pages/contact/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/pages/contact/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ...contactGates(['tanstack-query', 'rtk-query']),
  ['src/lib/apis/base/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/store/StoreProvider.tsx', [{ store: [undefined, 'zustand', 'tanstack-store'] }]],
  ['src/lib/providers/store/StoreProvider.tsx@redux-toolkit', [{ store: ['redux-toolkit'] }]],
  ['src/lib/store/counter/counterStore.ts@zustand', [{ store: ['zustand'] }]],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/lib/store/counter/counterStore.ts@redux-toolkit', [{
    store: ['redux-toolkit'],
    data: [undefined, 'tanstack-query'],
  }]],
  ['src/lib/store/counter/counterStore.ts@rtk-query', [{
    store: ['redux-toolkit'],
    data: ['rtk-query'],
  }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/button/Button.css', PRESSABLE],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/App.test.tsx', NO_ROUTER],
  ['src/App.test.tsx@with-router', [{ router: ['react-router', 'tanstack-router'] }]],
  ['src/components/features/app-header/AppHeader.test.tsx', NO_ROUTER],
  ['src/components/features/app-header/AppHeader.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes.test.ts@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/home.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/about.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/version.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/lib/apis/base/baseApi.test.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(reactTarget, 'react');

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
