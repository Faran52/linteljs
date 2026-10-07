import { hasLibrary } from '@utils/answerUtils';

import {
  hasForm,
  hasI18n,
  hasMsw,
  starterApplies,
} from './gateUtils';

import type { Answers, TargetId } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

interface ContactApiOptions {
  // The tree holding both wrappers, where the plain one is not `starter-source/shared/`'s.
  shared?: TargetId;
  // The tree holding the TanStack Query wrapper alone, where the plain one is `starter-source/shared/`'s.
  query?: TargetId;
  // The tree holding the barrel, where the wrapper it re-exports is not named `useSubmitContact`.
  barrel?: TargetId;
}

const CONTACT_FORM = 'src/lib/services/contact-form/contactFormService';

const CONTACT_SUBMIT = 'src/lib/apis/contact/contactEndpoints';

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

export const variantOf = (file: StarterFile | StarterTest, suffix: string): string => {
  return file.variant === undefined ? suffix : `${file.variant}-${suffix}`;
};

// A file whose words change once MSW answers the form, as an `msw` twin beside it.
export const mocked = <T extends StarterFile | StarterTest>(file: T): T[] => {
  const variants: T[] = [
    {
      ...file,
      when: (answers: Answers) => {
        return starterApplies(file, answers) && !hasMsw(answers);
      },
    },
    {
      ...file,
      when: (answers: Answers) => {
        return starterApplies(file, answers) && hasMsw(answers);
      },
      variant: variantOf(file, 'msw'),
    },
  ];

  return variants;
};

// The contact form's fetch wrapper, plain or through TanStack Query, behind the barrel its page imports.
export const contactApiFiles = (options: ContactApiOptions = {}): StarterFile[] => {
  const {
    barrel = true,
    shared,
    query = shared,
  } = options;
  const files: StarterFile[] = [
    {
      target: 'src/lib/apis/contact/index.ts',
      when: hasForm,
      shared: barrel,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: shared ?? true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      ...query === undefined ? {} : { shared: query },
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

const hasEnglishForm = (answers: Answers): boolean => {
  return hasForm(answers) && !hasI18n(answers);
};

// The English page's words, which say whether the form posts; under i18n the locale files say it.
export const contactCopyFiles = (when = hasEnglishForm): StarterFile[] => {
  return mocked<StarterFile>({
    target: 'src/lib/services/contact-form/constants.ts',
    when,
    shared: true,
  });
};

// RTK Query ships its own endpoints under this name.
const hasSharedSubmit = (answers: Answers): boolean => {
  return answers.data !== 'rtk-query';
};

// The submit posts where MSW answers it, and resolves locally where nothing would.
export const contactSubmitFiles = (stem = CONTACT_SUBMIT, hasContact = hasForm): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: `${stem}.ts`,
      source: `${CONTACT_SUBMIT}.ts`,
      when: (answers) => {
        return hasContact(answers) && hasSharedSubmit(answers) && !hasMsw(answers);
      },
      shared: true,
    },
    {
      target: `${stem}.ts`,
      source: `${CONTACT_SUBMIT}.ts`,
      when: (answers) => {
        return hasContact(answers) && hasSharedSubmit(answers) && hasMsw(answers);
      },
      variant: 'msw',
      shared: true,
    },
  ];

  return files;
};

export const contactSubmitTests = (stem = CONTACT_SUBMIT, suffix = 'test'): StarterTest[] => {
  const tests: StarterTest[] = [
    {
      target: `${stem}.${suffix}.ts`,
      covers: `${stem}.ts`,
      source: `${CONTACT_SUBMIT}.test.ts`,
      when: (answers) => {
        return hasSharedSubmit(answers) && !hasMsw(answers);
      },
      shared: true,
    },
    {
      target: `${stem}.${suffix}.ts`,
      covers: `${stem}.ts`,
      source: `${CONTACT_SUBMIT}.test.ts`,
      when: (answers) => {
        return hasSharedSubmit(answers) && hasMsw(answers);
      },
      variant: 'msw',
      shared: true,
    },
  ];

  return tests;
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

  const all = [
    ...files,
    ...contactCopyFiles(),
    ...contactSubmitFiles(),
  ];

  return all;
};
