import type { Artifact, Stage } from '@config/types';

export const emitted = (stage: Stage, target: string, text: string): Artifact => {
  return {
    stage,
    target,
    content: { text },
  };
};

export const copied = (target: string): Artifact => {
  return {
    stage: 'standard',
    target,
    content: { sources: [`project/${target}`] },
  };
};

export const joined = (target: string, sources: string[]): Artifact => {
  return {
    stage: 'standard',
    target,
    content: { sources },
  };
};

export const merged = (
  stage: Stage,
  target: string,
  merge: (current: string | null) => string,
  resync?: (current: string) => string,
): Artifact => {
  return {
    stage,
    target,
    content: resync === undefined
      ? { merge }
      : {
          merge,
          resync,
        },
  };
};
