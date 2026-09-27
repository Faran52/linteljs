import { run } from './floating';

// One of each, so a missing handover shows as a second finding rather than silence.
export const greet = (name: string, unusedArgument: number): string => {
  const unusedLocal = name.length;

  return name;
};
