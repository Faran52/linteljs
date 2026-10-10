import type { Artifact } from '@emitters';

// A fix goes back to its one template only when the emitter would write that template as the fixed text again.
export const templateOf = (artifact: Artifact, fixed: string): string | undefined => {
  const { content } = artifact;

  if (!('sources' in content) || content.sources.length !== 1) {
    return undefined;
  }

  const rewritten = content.transform === undefined ? fixed : content.transform(fixed, null);

  return rewritten === fixed ? content.sources[0] : undefined;
};
