import type { Surface } from '@config/types';
import type { OptionalMultiRecord } from '../../types';

// No `minimum`: an older config says `surfaces: []`.
export const surfacesAnswer = {
  key: 'surfaces',
  flag: 'surfaces',
  prompt: 'Surfaces',
  note: 'webextension only',
  slot: (target) => {
    return target.hostsBrowser === true;
  },
  kind: 'optionalMulti',
  values: {
    'popup': {
      label: 'Popup',
      hint: 'The toolbar button\'s page',
    },
    'background': {
      label: 'Background',
      hint: 'The service worker or event page',
    },
    'devtools-panel': {
      label: 'DevTools panel',
      hint: 'A tab inside the browser\'s developer tools',
    },
  },
} as const satisfies OptionalMultiRecord<Surface>;
