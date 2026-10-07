import { OPTIONS_UTILS } from '../constants';

import {
  always,
  hasForm,
  hasMsw,
} from './gateUtils';

import type { Answers, TargetId } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

// Only for `tanstack-query`: RTK Query generates its own hooks off `createApi`.
export interface AccessorNames {
  readonly directory: string;
  readonly query: string;
  readonly mutation: string;
  readonly testSuffix: string;
  // The shared option builders, under the target's own file naming.
  readonly optionsUtils?: string;
}

export interface AccessorSource {
  readonly shared: TargetId;
  readonly names: AccessorNames;
}

const FETCH_ADAPTER = 'src/lib/utils/fetchExtendedUtils';

// The handlers sit under `__mocks__/msw/`, outside `src/`, so they never reach a bundle or the coverage include.
// `hasContact`: whether the project has a contact page, whose POST the handlers answer.
export const mockFiles = (
  hasContact?: (answers: Answers) => boolean,
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
      when: hasMsw,
      shared: true,
    },
    // Passed in: reading the registry back from here would close a cycle.
    ...servesAWorker
      ? [{
        target: '__mocks__/msw/browser.ts',
        when: hasMsw,
        shared: true,
      } satisfies StarterFile]
      : [],
    ...hasContact === always
      ? []
      : [{
        target: '__mocks__/msw/handlers.ts',
        when: (answers) => {
          return hasMsw(answers) && hasContact?.(answers) !== true;
        },
        shared: true,
      } satisfies StarterFile],
    ...hasContact === undefined
      ? []
      : [{
        target: '__mocks__/msw/handlers.ts',
        when: (answers) => {
          return hasMsw(answers) && hasContact(answers);
        },
        variant: 'with-form',
        shared: true,
      } satisfies StarterFile],
  ];

  return files;
};

// `__mocks__/` carries no suite: only `src/` holds one test file per code file.
export const mockTests = (adapter = FETCH_ADAPTER, suffix = 'test'): StarterTest[] => {
  const tests: StarterTest[] = [{
    target: `${adapter}.${suffix}.ts`,
    covers: `${adapter}.ts`,
    source: `${FETCH_ADAPTER}.test.ts`,
    shared: true,
  }];

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

  const builders: StarterFile = {
    target: `${names.optionsUtils ?? OPTIONS_UTILS}.ts`,
    source: `${OPTIONS_UTILS}.ts`,
    when: usesQueryLibrary,
    shared: true,
  };

  const withBuilders = [...files, builders];

  return withBuilders;
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

  const stem = names.optionsUtils ?? OPTIONS_UTILS;

  const builders: StarterTest = {
    target: `${stem}${names.testSuffix}`,
    covers: `${stem}.ts`,
    source: `${OPTIONS_UTILS}.test.ts`,
    when: usesQueryLibrary,
    shared: true,
  };

  const withBuilders = [...tests, builders];

  return withBuilders;
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

const RTK_CONTACT = 'src/lib/apis/contact';

// The endpoint posts where MSW answers it, and resolves locally where nothing would.
const endpointVariants = <TStarter extends StarterFile | StarterTest>(starter: TStarter): TStarter[] => {
  const variants: TStarter[] = [
    {
      ...starter,
      when: (answers: Answers) => {
        return usesRtkContact(answers) && !hasMsw(answers);
      },
      variant: 'rtk-query',
    },
    {
      ...starter,
      when: (answers: Answers) => {
        return usesRtkContact(answers) && hasMsw(answers);
      },
      variant: 'rtk-query-msw',
    },
  ];

  return variants;
};

// React's tree holds them, which Next shares.
export const rtkContactFiles = (): StarterFile[] => {
  const api: StarterFile = {
    target: `${RTK_CONTACT}/contactApi.ts`,
    when: usesRtkContact,
    variant: 'rtk-query',
    shared: 'react',
  };

  const endpoints = endpointVariants<StarterFile>({
    target: `${RTK_CONTACT}/contactEndpoints.ts`,
    shared: 'react',
  });

  const all = [api, ...endpoints];

  return all;
};

export const rtkEndpointTests = (): StarterTest[] => {
  const tests = endpointVariants<StarterTest>({
    target: `${RTK_CONTACT}/contactEndpoints.test.ts`,
    covers: `${RTK_CONTACT}/contactEndpoints.ts`,
    shared: 'react',
  });

  return tests;
};
