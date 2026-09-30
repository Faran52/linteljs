import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../../types';

// Framework mode moves the build, typecheck, vite plugin and tsconfig, so the record is a function.
export const isFrameworkMode = (answers: Answers): boolean => {
  return answers.router === 'react-router-framework';
};

// The header links every page `pages/routes.tsx` lists, so the route config lists the contact page with it.
const withForm = (answers: Answers): boolean => {
  return isFrameworkMode(answers) && answers.form !== undefined;
};

const withoutForm = (answers: Answers): boolean => {
  return isFrameworkMode(answers) && answers.form === undefined;
};

const PAGES = [
  'home',
  'about',
  'version',
] as const;

export const frameworkRouteFiles = (): StarterFile[] => {
  return [
    ...PAGES
      .map((page): StarterFile => {
        return {
          target: `src/routes/${page}.tsx`,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };
      }),
    {
      target: 'src/routes.ts',
      when: withoutForm,
      variant: 'react-router-framework',
    },
    {
      target: 'src/routes.ts',
      when: withForm,
      variant: 'with-form',
    },
    {
      target: 'src/routes/contact.tsx',
      when: withForm,
      variant: 'react-router-framework',
    },
  ];
};

export const frameworkRouteTests = (): StarterTest[] => {
  return [
    ...PAGES
      .map((page): StarterTest => {
        return {
          target: `src/routes/${page}.test.tsx`,
          covers: `src/routes/${page}.tsx`,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };
      }),
    {
      target: 'src/routes.test.ts',
      covers: 'src/routes.ts',
      when: withoutForm,
      variant: 'react-router-framework',
    },
    {
      target: 'src/routes.test.ts',
      covers: 'src/routes.ts',
      when: withForm,
      variant: 'with-form',
    },
    {
      target: 'src/routes/contact.test.tsx',
      covers: 'src/routes/contact.tsx',
      when: withForm,
      variant: 'react-router-framework',
    },
  ];
};
