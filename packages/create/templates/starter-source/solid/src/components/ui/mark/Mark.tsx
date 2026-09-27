import { styles } from './styles';

import type { JSX } from 'solid-js';

export const Mark = (): JSX.Element => {
  return (
    <svg
      {...styles.mark}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      role="img"
      aria-label="linteljs"
    >
      <path d="M12 28 H108" stroke-width="13" />
      <path
        {...styles.line1}
        d="M12 58 H86"
        stroke-width="9"
      />
      <path
        {...styles.line2}
        d="M12 79 H104"
        stroke-width="9"
      />
      <path
        {...styles.line3}
        d="M12 100 H68"
        stroke-width="9"
      />
    </svg>
  );
};
