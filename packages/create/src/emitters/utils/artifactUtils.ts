import type { Artifact, Stage } from '../../config/artifact';

// The three ways an artifact is built, one per content shape. Every emitter in the ring reaches for one of them,
// so they sit here rather than beside the type: `config/` is the vocabulary, this is the construction of it.
export const emitted = (stage: Stage, target: string, text: string): Artifact => {
  return {
    stage,
    target,
    content: { text },
  };
};

// A shipped file that lands unchanged. Every one is stage 4.
export const copied = (target: string, ...sources: string[]): Artifact => {
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
): Artifact => {
  return {
    stage,
    target,
    content: { merge },
  };
};
