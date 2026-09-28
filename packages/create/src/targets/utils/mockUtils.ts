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
  return [
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
          return usesMsw(answers) && answers.form !== undefined;
        },
        variant: 'with-form',
        shared: true,
      } satisfies StarterFile]
      : [],
  ];
};

export const mockTests = (contact: boolean, adapter = 'src/lib/utils/fetchExtendedUtils'): StarterTest[] => {
  return [
    {
      target: `${adapter}.test.ts`,
      source: 'src/lib/utils/fetchExtendedUtils.test.ts',
      covers: `${adapter}.ts`,
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
          return usesMsw(answers) && answers.form !== undefined;
        },
        variant: 'with-form',
        shared: true,
      } satisfies StarterTest]
      : [],
  ];
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
  return [names.query, names.mutation]
    .map((entry): StarterFile => {
      return {
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
    });
};

export const accessorTests = (
  names: AccessorNames,
  from?: AccessorSource,
): StarterTest[] => {
  return [names.query, names.mutation]
    .map((entry): StarterTest => {
      const stem = accessorStem(names, entry);

      return {
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
    });
};

// `rtk-query` is `@reduxjs/toolkit`, and needs that store's reducer and middleware.
const usesRtkQuery = (answers: Answers): boolean => {
  return answers.data === 'rtk-query';
};

export const rtkFiles = (): StarterFile[] => {
  return [{
    target: 'src/lib/apis/base/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];
};

export const rtkTests = (): StarterTest[] => {
  return [{
    target: 'src/lib/apis/base/baseApi.test.ts',
    covers: 'src/lib/apis/base/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];
};
