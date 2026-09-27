import { hasForm } from './gateUtils';

import type { Answers } from '@answers/registry';
import type { TargetId } from '@answers/target/target/targetAnswer';
import type { StarterFile, StarterTest } from '../types';

/*
 * The data-access layer in whichever vocabulary the target speaks. React calls it a hook, Vue a composable, Solid
 * a primitive, and Angular has no such slot at all and reaches for a service, so the caller passes the directory
 * and the entry name rather than this module deciding one for everybody.
 *
 * Only for `tanstack-query`: RTK Query generates its own hooks off `createApi`, and a project answering neither
 * calls the api layer directly and has nothing to wrap.
 */
export interface AccessorNames {
  readonly directory: string;
  readonly query: string;
  readonly mutation: string;
  // `.spec.ts` on Angular, whose CLI names every suite that way, and `.test.ts` everywhere else.
  readonly testSuffix: string;
}

/*
 * Where a target takes another's accessors rather than writing its own: Next takes React's to the byte, and React
 * Native takes the same bytes to a different directory, which is what `source` is for. The entry names are the
 * source's too, so one name serves both ends of the path.
 */
export interface AccessorSource {
  readonly shared: TargetId;
  readonly names: AccessorNames;
}

const usesMsw = (answers: Answers): boolean => {
  return answers.mocking === 'msw';
};

// Whether a contact page is written for the handlers to answer: a form, on a target that writes the page.
const answersContact = (contact: boolean, answers: Answers): boolean => {
  return contact && hasForm(answers);
};

/**
 * The api edge, shared by every target because none of it has a framework in it: one adapter that speaks HTTP,
 * and the handlers that answer it in development and in the test run.
 *
 * The handlers live under `__mocks__/msw/` rather than in `src/`, beside the setup file that starts them, which
 * is where this repository already keeps its test doubles. They never reach a production bundle, so they are not
 * source, and being outside `src/` takes them out of the coverage include rather than needing an exemption.
 *
 * The handlers come in two spellings for one reason: the contact endpoint answers a page that exists only where a
 * form does, on a target that writes one, and a handler for a route nobody generated is a handler nobody can reach.
 * `contact` is that target: the with-form handlers import the contact schemas, which only its own starter writes.
 */
export const mockFiles = (
  contact: boolean,
  servesAWorker = true,
  adapter = 'src/lib/utils/fetchExtended.ts',
): StarterFile[] => {
  return [
    /*
     * Unconditional. Every project gets one place that speaks HTTP, whether or not it answered a query library or
     * a mocking layer: a project without either still makes requests, and the alternative is each of them writing
     * its own `fetch` wrapper the first time it needs one.
     *
     * The destination is a parameter because Angular names every source file in kebab and the other nine name
     * theirs in camel, so one asset lands as `fetchExtended.ts` on nine and `fetch-extended.ts` on the tenth.
     */
    {
      target: adapter,
      source: 'src/lib/utils/fetchExtended.ts',
      shared: true,
    },
    {
      target: '__mocks__/msw/node.ts',
      when: usesMsw,
      shared: true,
    },
    /*
     * A worker is a file the page fetches, so it needs a directory the dev server serves. Passed in rather than
     * read off the record: this module is imported by every target, and reading the registry back would close a
     * cycle through it. React Native is the one that passes `false`, having no dev server to serve one, and so has
     * no entry at all rather than one no answer could reach.
     */
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

// Each suite follows the file it covers, so the handler pair is picked the same way the handlers are.
export const mockTests = (contact: boolean, adapter = 'src/lib/utils/fetchExtended'): StarterTest[] => {
  return [
    {
      target: `${adapter}.test.ts`,
      source: 'src/lib/utils/fetchExtended.test.ts',
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

// Where an accessor sits, less its extension: the module adds `.ts`, being a hook and never a component, and its
// suite adds the target's own test suffix.
const accessorStem = (names: AccessorNames, entry: string): string => {
  const kebab = entry.replaceAll(/(?<=[a-z])(?=[A-Z])/g, '-').toLowerCase();

  return `${names.directory}/${kebab}/${entry}`;
};

export const accessorFiles = (
  names: AccessorNames,
  from?: AccessorSource,
): StarterFile[] => {
  return [names.query, names.mutation].map((entry): StarterFile => {
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
  return [names.query, names.mutation].map((entry): StarterTest => {
    // The suite sits beside its subject under the same directory.
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

/*
 * RTK Query's equivalent of the adapter and the accessors, which is one file because the library generates the
 * hooks itself. Offered only where the store that ships it is: `rtk-query` is `@reduxjs/toolkit`, and it needs
 * that store's reducer and middleware to be registered at all.
 */
const usesRtkQuery = (answers: Answers): boolean => {
  return answers.data === 'rtk-query';
};

export const rtkFiles = (): StarterFile[] => {
  return [{
    target: 'src/lib/apis/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];
};

export const rtkTests = (): StarterTest[] => {
  return [{
    target: 'src/lib/apis/baseApi.test.ts',
    covers: 'src/lib/apis/baseApi.ts',
    when: usesRtkQuery,
    variant: 'rtk-query',
    shared: true,
  }];
};
