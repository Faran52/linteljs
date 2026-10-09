import type { Share } from '@assemble/utils/shareUtils';
import type { Answered } from '@choices/read/manifest/manifestReader';

export interface Generated {
  path: string;
  text: string;
}

// What a framework adds to its picked drawers: the files it builds in code and its share of the generated ones.
export interface Framed {
  files: Generated[];
  share: Share;
}

export type FrameworkModule = (name: string, answers: Answered) => Framed;
