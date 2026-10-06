import { rendersWithReact } from '@utils/answerUtils';

import type { Form } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

export const formAnswer = {
  key: 'form',
  flag: 'form',
  prompt: 'Form library',
  slot: (target) => {
    return target.libraryProject !== true;
  },
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
} as const satisfies OptionalChoiceRecord<Form>;
