import { type Drawn, type DrawnFile } from '../../read/drawer/drawerReader';
import { mergedShare, type Share } from '../../utils/shareUtils';

export interface Merged {
  files: DrawnFile[];
  share: Share;
}

// A path two drawers hold is an authoring error, as is a share key at two values.
export const drawersMerge = (drawn: readonly Drawn[]): Merged => {
  const owners = new Map<string, string>();
  const files: DrawnFile[] = [];
  let share: Share = {};

  for (const drawer of drawn) {
    for (const file of drawer.files) {
      const owner = owners.get(file.path);

      if (owner !== undefined) {
        throw new Error(`${file.path} is in both ${owner} and ${drawer.name}`);
      }

      owners.set(file.path, drawer.name);
      files.push(file);
    }

    share = mergedShare(share, drawer.share);
  }

  const merged: Merged = {
    files,
    share,
  };

  return merged;
};
