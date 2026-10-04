import { hasLibrary } from '@utils/answerUtils';

import { hasForm } from './gateUtils';

import type { TargetId } from '@config/types';
import type { StarterFile } from '../types';

interface ContactApiOptions {
  // The target also offers RTK Query, whose own `createApi` barrel replaces this one.
  rtk?: true;
  // The tree holding both wrappers, where the plain one is not `starter-source/shared/`'s.
  shared?: TargetId;
}

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
export const contactApiFiles = ({ rtk, shared }: ContactApiOptions = {}): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: 'src/lib/apis/contact/index.ts',
      when: (answers) => {
        return hasForm(answers) && (rtk === undefined || answers.data !== 'rtk-query');
      },
      shared: true,
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
      ...(shared === undefined ? {} : { shared }),
    },
  ];

  return files;
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
  ];

  return files;
};
