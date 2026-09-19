import { rendersWithReact } from '../utils/answerUtils';

import type { AnswerRecord } from '../record';

export type Form = keyof typeof form.values;

export const form = {
  key: 'form',
  flag: 'form',
  prompt: 'Form library',
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'Plain controlled inputs',
  },
  values: {
    'tanstack-form': {
      label: 'TanStack Form',
      hint: 'Typed forms with Zod-ready validation',
    },
    'react-hook-form': {
      label: 'React Hook Form',
      hint: 'Uncontrolled React forms, React targets only',
      only: (target) => {
        return rendersWithReact(target.framework);
      },
    },
  },
} as const satisfies AnswerRecord;
