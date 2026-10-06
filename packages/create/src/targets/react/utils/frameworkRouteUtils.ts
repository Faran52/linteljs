import { hasForm } from '../../utils/gateUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../../types';

// Framework mode moves the build, typecheck, vite plugin and tsconfig, so the record is a function.
export const isFrameworkMode = (answers: Answers): boolean => {
  return answers.router === 'react-router-framework';
};

export const hasRouter = (answers: Answers): boolean => {
  return answers.router !== undefined;
};

// The header links every page `pages/routes.tsx` lists, so the route config lists the contact page with it.
const withForm = (answers: Answers): boolean => {
  return isFrameworkMode(answers) && hasForm(answers);
};

const withoutForm = (answers: Answers): boolean => {
  return isFrameworkMode(answers) && answers.form === undefined;
};

const ROUTE_MODULES = [
  'home/HomeRoute',
  'about/AboutRoute',
  'version/VersionRoute',
  'not-found/NotFoundRoute',
] as const;

export const frameworkRouteFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    ...ROUTE_MODULES
      .map((module): StarterFile => {
        const file: StarterFile = {
          target: `src/routes/${module}.tsx`,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };

        return file;
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
      target: 'src/routes/contact/ContactRoute.tsx',
      when: withForm,
      variant: 'react-router-framework',
    },
  ];

  return files;
};

export const frameworkRouteTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...ROUTE_MODULES
      .map((module): StarterTest => {
        const test: StarterTest = {
          target: `src/routes/${module}.test.tsx`,
          covers: `src/routes/${module}.tsx`,
          when: isFrameworkMode,
          variant: 'react-router-framework',
        };

        return test;
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
      target: 'src/routes/contact/ContactRoute.test.tsx',
      covers: 'src/routes/contact/ContactRoute.tsx',
      when: withForm,
      variant: 'react-router-framework',
    },
  ];

  return tests;
};
