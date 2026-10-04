import type { Artifact, Stage } from '@config/types';

export const emitted = (stage: Stage, target: string, text: string): Artifact => {
  const artifact: Artifact = {
    stage,
    target,
    content: { text },
  };

  return artifact;
};

export const copied = (target: string): Artifact => {
  const artifact: Artifact = {
    stage: 'standard',
    target,
    content: { sources: [`project/${target}`] },
  };

  return artifact;
};

export const joined = (target: string, sources: string[]): Artifact => {
  const artifact: Artifact = {
    stage: 'standard',
    target,
    content: { sources },
  };

  return artifact;
};

export const merged = (
  stage: Stage,
  target: string,
  merge: (current: string | null) => string,
): Artifact => {
  const artifact: Artifact = {
    stage,
    target,
    content: { merge },
  };

  return artifact;
};
