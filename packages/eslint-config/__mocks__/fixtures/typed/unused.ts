import { run } from './floating';

// One of each: an unused import, an unused local and an unused argument, so every owner the layer turns off has
// something to report and a missing handover shows up as a second finding rather than as silence.
export const greet = (name: string, unusedArgument: number): string => {
  const unusedLocal = name.length;

  return name;
};
