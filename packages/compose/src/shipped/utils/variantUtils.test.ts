import { shippedVariants } from '@mocks/shippedTree';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { SUBJECTS } from '../constants';

import {
  type Parameter,
  type Subject,
  subjectVariants,
  type Variant,
} from './variantUtils';

const SUBJECT: Subject = {
  shell: 'app',
  path: 'src/a.ts',
  base: 'shared/a/a.ts',
  parameters: {},
  groups: [],
  plainData: [],
  pureCalls: [],
  modules: {},
};

const withParameter = (parameter: Parameter): Subject => {
  const subject: Subject = { ...SUBJECT, parameters: { './part': parameter } };

  return subject;
};

const COUNTS = {
  'vite-react src/components/features/app-header/AppHeader.tsx': 6,
  'vite-react src/pages/home/HomePage.tsx': 4,
  'vite-react src/pages/home/HomePage.styles.ts styling stylex': 2,
  'vite-react src/App.test.tsx': 2,
  'vite-react src/components/features/app-header/AppHeader.test.tsx': 3,
  'vite-react src/components/features/route-error/RouteError.test.tsx': 2,
  'vite-react src/root.tsx': 2,
  'astro src/lib/apis/contact/contactEndpoints.test.ts': 2,
  'astro src/views/contact/ContactPage.test.tsx': 2,
  'astro src/views/contact/ContactIsland.test.tsx': 2,
  'nuxt src/lib/apis/contact/contactEndpoints.test.ts': 2,
  'sveltekit src/lib/apis/contact/contactEndpoints.test.ts': 2,
  'sveltekit src/routes/page.test.ts': 2,
  'sveltekit src/views/home/HomeView.styles.ts styling stylex': 2,
  'sveltekit src/views/home/HomeView.styles.ts styling css': 2,
  'vite-solid src/lib/apis/contact/contactEndpoints.test.ts': 2,
  'vite-solid src/pages/home/HomePage.test.tsx': 2,
  'vite-solid src/pages/home/HomePage.tsx': 2,
  'vite-solid src/pages/home/HomePage.styles.ts styling stylex': 2,
  'vite-solid src/pages/home/HomePage.styles.ts styling css': 2,
  'vite-vue src/lib/apis/contact/contactEndpoints.test.ts': 2,
  'vite-vue src/views/home/HomeView.test.ts': 2,
  'vite-vue src/views/home/HomeView.styles.ts styling stylex': 2,
  'vite-vue src/views/home/HomeView.styles.ts styling css': 2,
  'angular-cli src/lib/apis/contact/contact-endpoints.spec.ts': 2,
  'angular-cli src/app/home/home.spec.ts': 2,
  'angular-cli src/app/home/home.styles.ts styling css': 2,
  'angular-cli src/app/home/home.ts': 2,
  'next src/app/page.test.tsx': 2,
  'next src/app/page.styles.ts styling stylex': 2,
  'next src/app/page.tsx styling atomic': 2,
  'expo src/app-layout.test.tsx': 2,
  'expo src/app/_layout.tsx': 2,
  'wxt src/background/onInstalled.test.ts': 2,
  'wxt src/devtools/devtools.ts': 2,
  'wxt src/background/onInstalled.ts': 2,
};

describe('subjectVariants, on the shipped table', () => {
  it('finds each subject\'s variants, and no other subject', () => {
    const counts = SUBJECTS
      .map((subject) => {
        const where = Object.entries(subject.where ?? {})
          .flat();
        const key = [
          subject.shell,
          subject.path,
          ...where,
        ].join(' ');
        const variants = shippedVariants(subject);
        const count: [string, number] = [key, variants.length];

        return count;
      });

    expect(counts).toEqual(Object.entries(COUNTS));
  });
});

describe('subjectVariants', () => {
  const shippedOf = (subject: Subject, shipped: string[], sources: string[]): string[] => {
    return subjectVariants(subject, shipped, sources)
      .map(({ shipped }) => {
        return shipped;
      });
  };

  const optionsOf = (subject: Subject, shipped: string[], sources: string[]): Variant['options'][] => {
    return subjectVariants(subject, shipped, sources)
      .map(({ options }) => {
        return options;
      });
  };

  const shippedWith = (parameter: Parameter, shipped: string[], sources: string[]): string[] => {
    const subject = withParameter(parameter);

    return shippedOf(subject, shipped, sources);
  };

  const optionsWith = (parameter: Parameter, shipped: string[], sources: string[]): Variant['options'][] => {
    const subject = withParameter(parameter);

    return optionsOf(subject, shipped, sources);
  };

  it('finds every file of the shell that ends in the path, sorted by where it ships', () => {
    const paths = [
      'app/a/1/b/2/src/a.ts',
      'app/src/a.ts',
      'app/base/src/a.ts',
      'app/z/1/src/a.ts',
      'app/z/1/src/b.ts',
      'app/z/1/other-src/a.ts',
      'web/z/1/src/a.ts',
    ];
    const variants = subjectVariants(SUBJECT, paths, []);

    expect(variants).toEqual([
      { options: {}, shipped: 'app/a/1/b/2/src/a.ts' },
      { options: {}, shipped: 'app/base/src/a.ts' },
      { options: {}, shipped: 'app/src/a.ts' },
      { options: {}, shipped: 'app/z/1/src/a.ts' },
    ]);
  });

  it.each(['app/store/src/a.ts', 'app/base/store/one/src/a.ts'])('refuses %s, whose folders do not pair', (shipped) => {
    const run = (): string[] => {
      return shippedOf(SUBJECT, [shipped], []);
    };

    const message = `${shipped}: its folders above the composed path are not question and value pairs`;

    expect(run).toThrow(message);
  });

  it('takes the files that carry every value of where, read as a question and its value', () => {
    const paths = [
      'app/store/one/styling/css/src/a.ts',
      'app/store/two/styling/css/src/a.ts',
      'app/store/one/styling/atomic/src/a.ts',
      'app/styling/store/store/one/src/a.ts',
      'app/base/src/a.ts',
    ];
    const shipped = shippedOf({ ...SUBJECT, where: { store: 'one', styling: 'css' } }, paths, []);
    const storeOnly = shippedOf({ ...SUBJECT, where: { store: 'one' } }, paths, []);

    expect(shipped).toEqual(['app/store/one/styling/css/src/a.ts']);

    expect(storeOnly).toEqual([
      'app/store/one/styling/atomic/src/a.ts',
      'app/store/one/styling/css/src/a.ts',
      'app/styling/store/store/one/src/a.ts',
    ]);
  });

  it('refuses a file with no folder for the question, naming what asks it', () => {
    const paths = ['app/styling/css/src/a.ts'];

    const run = (): string[] => {
      return shippedWith({ question: 'store' }, paths, []);
    };

    expect(run).toThrow('app/styling/css/src/a.ts: no store folder for ./part');
  });

  it('takes the file named for the value', () => {
    const paths = [
      'app/part/one/src/a.ts',
      'app/part/two/src/a.ts',
    ];
    const options = optionsWith({ question: 'part' }, paths, [
      'part.ts',
      'part.one.ts',
      'part.two.tsx',
      'other.one.ts',
    ]);

    expect(options).toEqual([{ './part': 'part.one.ts' }, { './part': 'part.two.tsx' }]);
  });

  it('gives each parameter its own option', () => {
    const paths = ['app/store/one/styling/css/src/a.ts'];
    const options = optionsOf({
      ...SUBJECT,
      parameters: { './store': { question: 'store' }, './styling': { question: 'styling' } },
    }, paths, ['store.one.ts', 'styling.css.ts']);

    expect(options).toEqual([{ './store': 'store.one.ts', './styling': 'styling.css.ts' }]);
  });

  it('takes the default module for the default value, and the file named for another', () => {
    const paths = [
      'app/part/one/src/a.ts',
      'app/part/two/src/a.ts',
    ];
    const options = optionsWith({ question: 'part', default: 'one' }, paths, ['part.ts', 'part.two.ts']);

    expect(options).toEqual([{ './part': 'part.ts' }, { './part': 'part.two.ts' }]);
  });

  it('refuses a default value that has its own file', () => {
    const paths = ['app/part/one/src/a.ts'];

    const run = (): string[] => {
      return shippedWith({ question: 'part', default: 'one' }, paths, ['part.ts', 'part.one.ts']);
    };

    expect(run).toThrow('app/part/one/src/a.ts: ./part has two sources for part one, its default and part.one');
  });

  it.each([
    {
      name: 'a value with no file and no default',
      parameter: { question: 'part' },
      sources: ['part.ts'],
      stem: 'part.one',
    },
    {
      name: 'a value with no file beside another default',
      parameter: { question: 'part', default: 'two' },
      sources: ['part.ts'],
      stem: 'part.one',
    },
    {
      name: 'a value with two files',
      parameter: { question: 'part' },
      sources: ['part.one.ts', 'part.one.tsx'],
      stem: 'part.one',
    },
    {
      name: 'a default with no module',
      parameter: { question: 'part', default: 'one' },
      sources: [],
      stem: 'part',
    },
    {
      name: 'a default with two modules',
      parameter: { question: 'part', default: 'one' },
      sources: ['part.ts', 'part.tsx'],
      stem: 'part',
    },
  ])('refuses $name', ({
    parameter,
    sources,
    stem,
  }) => {
    const paths = ['app/part/one/src/a.ts'];

    const run = (): string[] => {
      return shippedWith(parameter, paths, sources);
    };

    expect(run).toThrow(`app/part/one/src/a.ts: no single ${stem} option file for ./part at part one`);
  });

  it('takes the file the map names, whatever else is named for the value', () => {
    const paths = ['app/part/one/src/a.ts'];
    const sources = ['part.one.ts', 'part.counter.ts'];
    const options = optionsWith({ question: 'part', files: { one: 'part.counter.ts' } }, paths, sources);

    expect(options).toEqual([{ './part': 'part.counter.ts' }]);
  });

  it('refuses a value the map does not name, though a file is named for it', () => {
    const paths = ['app/part/one/src/a.ts'];

    const run = (): string[] => {
      return shippedWith({ question: 'part', files: { two: 'part.one.ts' } }, paths, ['part.one.ts']);
    };

    expect(run).toThrow('app/part/one/src/a.ts: the files of ./part name none for part one');
  });

  it('refuses a map that names a file that is not there', () => {
    const paths = ['app/part/one/src/a.ts'];

    const run = (): string[] => {
      return shippedWith({ question: 'part', files: { one: 'part.ts' } }, paths, []);
    };

    expect(run).toThrow('app/part/one/src/a.ts: no option file part.ts for ./part at part one');
  });
});
