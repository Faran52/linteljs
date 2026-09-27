import { targetFor } from '@targets';

import type { Answers } from '@config/types';

// The target's own spelling where present, the project's first otherwise: a project keeping `styles/global.css`
// beside the standard's entry was once read as the earlier-sorting one.
export const projectSpelling = (own: string, present: readonly string[]): string => {
  return present.includes(own) ? own : present[0] ?? own;
};

// `.tsx` on the React family, where a rendering setup needs JSX (read off `jsx`, since Solid and Vue set `preserve`).
export const setupTestsPath = (answers: Answers, present: readonly string[] = []): string => {
  const own = targetFor(answers).tsconfig.jsx === 'react-jsx'
    ? '__mocks__/setupTests.tsx'
    : '__mocks__/setupTests.ts';

  return projectSpelling(own, present);
};
