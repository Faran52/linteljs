import type { Share } from '@assemble/utils/shareUtils';
import type { Answered } from '@choices/read/manifest/manifestReader';
import type { Host } from '@config/types';

export interface Generated {
  path: string;
  text: string;
}

// Template fragments under `templates/`, joined in order at write time.
export interface Joined {
  path: string;
  sources: string[];
}

// What a framework adds to its picked drawers: the files it builds in code and its share of the generated ones.
export interface Framed {
  files: (Generated | Joined)[];
  share: Share;
}

export type FrameworkModule = (name: string, answers: Answered, host: Host) => Framed;
