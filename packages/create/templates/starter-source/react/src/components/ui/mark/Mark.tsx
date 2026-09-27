import { styles } from './styles';

import type { FC } from 'react';

export const Mark: FC = () => {
  return (
    <svg
      {...styles.mark}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      role="img"
      aria-label="linteljs"
    >
      <path d="M12 28 H108" strokeWidth="13" />
      <path
        {...styles.line1}
        d="M12 58 H86"
        strokeWidth="9"
      />
      <path
        {...styles.line2}
        d="M12 79 H104"
        strokeWidth="9"
      />
      <path
        {...styles.line3}
        d="M12 100 H68"
        strokeWidth="9"
      />
    </svg>
  );
};
