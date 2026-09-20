import type { AnswerRecord } from '../../types';

export type Surface = keyof typeof surfacesAnswer.values;

// `minimum` stays unset: the interactive prompt requires one pick on its own, but a config or flag may still say
// `surfaces: []`, which is what an older config means by having none of this at all.
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
} as const satisfies AnswerRecord;
