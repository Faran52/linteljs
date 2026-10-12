import { basename, join } from 'node:path';

import { omit } from 'es-toolkit';

import { parsedAs } from '@utils/objectUtils';

import { filesUnder, readIfPresent } from '@disk';

import { isShare, type Share } from '../../utils/shareUtils';

export interface DrawnFile {
  path: string;
  source: string;
}

export interface Drawn {
  name: string;
  files: DrawnFile[];
  share: Share;
}

const SHARE_FILE = 'share.json';

// `drawer` is a path under `root`; a drawer may hold files only, a share only, or both.
export const drawerReader = async (root: string, drawer: string, withTests: boolean): Promise<Drawn> => {
  const directory = join(root, drawer);
  const paths = await filesUnder(directory);
  const text = await readIfPresent(join(directory, SHARE_FILE));
  const parsed = text === null ? {} : parsedAs(text, isShare);

  if (parsed === null) {
    throw new Error(`${drawer}/${SHARE_FILE} is not an object`);
  }

  // `$schema` is for the editor; relative to its file, it differs per depth and would clash on merge.
  const share = omit(parsed, ['$schema']);

  const files = paths
    .filter((path) => {
      return path !== SHARE_FILE && (withTests || !basename(path).includes('.test.'));
    })
    .map((path) => {
      const file: DrawnFile = {
        path,
        source: join(directory, path),
      };

      return file;
    });

  const drawn: Drawn = {
    name: drawer,
    files,
    share,
  };

  return drawn;
};
