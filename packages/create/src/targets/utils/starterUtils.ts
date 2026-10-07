import { hasLibrary } from '@utils/answerUtils';

import { hasForm } from './gateUtils';

import type { TargetId } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

interface ContactApiOptions {
  // The tree holding both wrappers, where the plain one is not `starter-source/shared/`'s.
  shared?: TargetId;
  // The tree holding the barrel, where the wrapper it re-exports is not named `useSubmitContact`.
  barrel?: TargetId;
}

const CONTACT_FORM = 'src/lib/services/contact-form/contactFormService';

// Each path as a starter file carrying the same fields.
export const filesAt = (paths: readonly string[], fields: Omit<StarterFile, 'target'> = {}): StarterFile[] => {
  return paths
    .map((target): StarterFile => {
      const file: StarterFile = {
        target,
        ...fields,
      };

      return file;
    });
};

// The contact form's fetch wrapper, plain or through TanStack Query, behind the barrel its page imports.
export const contactApiFiles = (options: ContactApiOptions = {}): StarterFile[] => {
  const { barrel = true, ...trees } = options;
  const files: StarterFile[] = [
    {
      target: 'src/lib/apis/contact/index.ts',
      when: (answers) => {
        // RTK Query, offered only beside its Redux store, keeps its own `createApi` barrel.
        return hasForm(answers) && answers.data !== 'rtk-query';
      },
      shared: barrel,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: trees.shared ?? true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      ...trees,
    },
  ];

  return files;
};

// The contact form's words and rules, under Angular's kebab stem where it is passed one.
export const contactFormTest = (stem = CONTACT_FORM, suffix = 'test'): StarterTest => {
  const test: StarterTest = {
    target: `${stem}.${suffix}.ts`,
    covers: `${stem}.ts`,
    source: `${CONTACT_FORM}.test.ts`,
    shared: true,
  };

  return test;
};

export const contactFormFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: `${CONTACT_FORM}.ts`,
      when: (answers) => {
        return hasForm(answers) && !hasLibrary(answers, 'zod');
      },
      shared: true,
    },
    {
      target: `${CONTACT_FORM}.ts`,
      when: (answers) => {
        return hasForm(answers) && hasLibrary(answers, 'zod');
      },
      variant: 'zod',
      shared: true,
    },
  ];

  return files;
};
