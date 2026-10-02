import { hasForm } from './gateUtils';

import type { Answers, TargetId } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

// Only for `tanstack-query`: RTK Query generates its own hooks off `createApi`.
export interface AccessorNames {
  readonly directory: string;
  readonly query: string;
  readonly mutation: string;
  readonly testSuffix: string;
}

export interface AccessorSource {
  readonly shared: TargetId;
  readonly names: AccessorNames;
}

const FETCH_ADAPTER = 'src/lib/utils/fetchExtendedUtils';

const usesMsw = (answers: Answers): boolean => {
  return answers.mocking === 'msw';
};

const answersContact = (contact: boolean, answers: Answers): boolean => {
  return contact && hasForm(answers);
};

// The handlers sit under `__mocks__/msw/`, outside `src/`, so they never reach a bundle or the coverage include.
export const mockFiles = (
  contact: boolean,
  servesAWorker = true,
  adapter = 'src/lib/utils/fetchExtendedUtils.ts',
): StarterFile[] => {
  const files: StarterFile[] = [
    // Unconditional: a project without a query library still makes requests.
    {
      target: adapter,
      source: 'src/lib/utils/fetchExtendedUtils.ts',
      shared: true,
    },
    {
      target: '__mocks__/msw/node.ts',
      when: usesMsw,
      shared: true,
    },
    // Passed in: reading the registry back from here would close a cycle.
    ...servesAWorker
      ? [{
        target: '__mocks__/msw/browser.ts',
        when: usesMsw,
        shared: true,
      } satisfies StarterFile]
      : [],
    {
      target: '__mocks__/msw/handlers.ts',
      when: (answers) => {
        return usesMsw(answers) && !answersContact(contact, answers);
      },
      shared: true,
    },
    ...contact
      ? [{
        target: '__mocks__/msw/handlers.ts',
        when: (answers) => {
          return usesMsw(answers) && hasForm(answers);
        },
        variant: 'with-form',
        shared: true,
      } satisfies StarterFile]
      : [],
  ];

  return files;
};

export const mockTests = (contact: boolean, adapter = FETCH_ADAPTER): StarterTest[] => {
  const tests: StarterTest[] = [
    {
      target: `${adapter}.test.ts`,
      covers: `${adapter}.ts`,
      source: `${FETCH_ADAPTER}.test.ts`,
      shared: true,
    },
    {
      target: '__mocks__/msw/handlers.test.ts',
      covers: '__mocks__/msw/handlers.ts',
      when: (answers) => {
        return usesMsw(answers) && !answersContact(contact, answers);
      },
      shared: true,
    },
    ...contact
      ? [{
        target: '__mocks__/msw/handlers.test.ts',
        covers: '__mocks__/msw/handlers.ts',
        when: (answers) => {
          return usesMsw(answers) && hasForm(answers);
        },
        variant: 'with-form',
        shared: true,
      } satisfies StarterTest]
      : [],
  ];

  return tests;
};

const usesQueryLibrary = (answers: Answers): boolean => {
  return answers.data === 'tanstack-query';
};

const accessorStem = (names: AccessorNames, entry: string): string => {
  const kebab = entry
    .replaceAll(/(?<=[a-z])(?=[A-Z])/g, '-')
    .toLowerCase();

  return `${names.directory}/${kebab}/${entry}`;
};

export const accessorFiles = (
  names: AccessorNames,
  from?: AccessorSource,
): StarterFile[] => {
  const files = [names.query, names.mutation]
    .map((entry): StarterFile => {
      const file: StarterFile = {
        target: `${accessorStem(names, entry)}.ts`,
        when: usesQueryLibrary,
        variant: 'tanstack-query',
        ...(from === undefined
          ? {}
          : {
              shared: from.shared,
              source: `${accessorStem(from.names, entry)}.ts`,
            }),
      };

      return file;
    });

  return files;
};

export const accessorTests = (
  names: AccessorNames,
  from?: AccessorSource,
): StarterTest[] => {
  const tests = [names.query, names.mutation]
    .map((entry): StarterTest => {
      const stem = accessorStem(names, entry);

      const test: StarterTest = {
        target: `${stem}${names.testSuffix}`,
        covers: `${stem}.ts`,
        when: usesQueryLibrary,
        variant: 'tanstack-query',
        ...(from === undefined
          ? {}
          : {
              shared: from.shared,
              source: `${accessorStem(from.names, entry)}${from.names.testSuffix}`,
            }),
      };

      return test;
    });

  return tests;
};

// `rtk-query` is `@reduxjs/toolkit`, and needs that store's reducer and middleware.
const usesRtkQuery = (answers: Answers): boolean => {
  return answers.data === 'rtk-query';
};

export const rtkFiles = (): StarterFile[] => {
  const files: StarterFile[] = [{
    target: 'src/lib/apis/base/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];

  return files;
};

export const rtkTests = (): StarterTest[] => {
  const tests: StarterTest[] = [{
    target: 'src/lib/apis/base/baseApi.test.ts',
    covers: 'src/lib/apis/base/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];

  return tests;
};

const usesRtkContact = (answers: Answers): boolean => {
  return hasForm(answers) && usesRtkQuery(answers);
};

const RTK_CONTACT_STEMS = ['contactEndpoints', 'contactHooks'] as const;

// React's tree holds them, which Next shares.
export const rtkContactFiles = (): StarterFile[] => {
  const files = ['index', ...RTK_CONTACT_STEMS]
    .map((stem): StarterFile => {
      const file: StarterFile = {
        target: `src/lib/apis/contact/${stem}.ts`,
        when: usesRtkContact,
        variant: 'rtk-query',
        shared: 'react',
      };

      return file;
    });

  return files;
};

export const rtkContactTests = (): StarterTest[] => {
  return RTK_CONTACT_STEMS
    .map((stem): StarterTest => {
      const test: StarterTest = {
        target: `src/lib/apis/contact/${stem}.test.ts`,
        covers: `src/lib/apis/contact/${stem}.ts`,
        variant: 'rtk-query',
        shared: 'react',
      };

      return test;
    });
};
