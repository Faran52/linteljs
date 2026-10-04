import { hasLibrary } from '@utils/answerUtils';

import { hasForm } from './gateUtils';

import type { TargetId } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

interface ContactApiOptions {
  // The tree holding both wrappers, where the plain one is not `starter-source/shared/`'s.
  shared?: TargetId;
}

const SUBMISSION = 'src/lib/apis/contact/submission';

const FORM_VALIDATOR = 'src/lib/apis/contact/formValidator';

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
  const files: StarterFile[] = [
    {
      target: 'src/lib/apis/contact/index.ts',
      when: (answers) => {
        // RTK Query, offered only beside its Redux store, keeps its own `createApi` barrel.
        return hasForm(answers) && answers.data !== 'rtk-query';
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === undefined;
      },
      shared: options.shared ?? true,
    },
    {
      target: 'src/lib/apis/contact/contactApi.ts',
      when: (answers) => {
        return hasForm(answers) && answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      ...options,
    },
    {
      target: `${SUBMISSION}.ts`,
      when: (answers) => {
        return hasForm(answers) && (answers.data === undefined || answers.data === 'tanstack-query');
      },
      shared: true,
    },
  ];

  return files;
};

// Angular names its suites `.spec.ts`; the file under test is one word, so the same name in either case.
export const submissionTest = (suffix = 'test'): StarterTest => {
  const test: StarterTest = {
    target: `${SUBMISSION}.${suffix}.ts`,
    covers: `${SUBMISSION}.ts`,
    source: 'src/lib/apis/contact/submission.test.ts',
    shared: true,
  };

  return test;
};

// TanStack Form's form-level validator over the contact rules, under Angular's kebab stem where it is passed one.
export const formValidatorFile = (stem = FORM_VALIDATOR): StarterFile => {
  const file: StarterFile = {
    target: `${stem}.ts`,
    source: `${FORM_VALIDATOR}.ts`,
    when: (answers) => {
      return answers.form === 'tanstack-form';
    },
    shared: true,
  };

  return file;
};

export const formValidatorTest = (stem = FORM_VALIDATOR, suffix = 'test'): StarterTest => {
  const test: StarterTest = {
    target: `${stem}.${suffix}.ts`,
    covers: `${stem}.ts`,
    source: `${FORM_VALIDATOR}.test.ts`,
    shared: true,
  };

  return test;
};

export const contactSchemaFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && !hasLibrary(answers, 'zod');
      },
      shared: true,
    },
    {
      target: 'src/lib/apis/contact/schemas.ts',
      when: (answers) => {
        return hasForm(answers) && hasLibrary(answers, 'zod');
      },
      variant: 'zod',
      shared: true,
    },
    formValidatorFile(),
  ];

  return files;
};
