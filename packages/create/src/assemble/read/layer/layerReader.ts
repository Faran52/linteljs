import { join } from 'node:path';

import { parsedAs } from '@utils/objectUtils';

import { directoriesIn, readIfPresent } from '@disk';

import {
  isShare,
  type Share,
  shareOf,
  stringsOf,
} from '../../utils/shareUtils';
import { drawerReader, type Drawn } from '../drawer/drawerReader';

// Question key or fact -> the values given; a key with none still marks its folder as a question.
export type Given = Record<string, string[]>;

const groupsOf = async (root: string, question: string): Promise<Share> => {
  const text = await readIfPresent(join(root, question, 'share.json'));
  const share = text === null ? {} : parsedAs(text, isShare);

  if (share === null) {
    throw new Error(`${question}/share.json is not an object`);
  }

  return shareOf(share, 'groups');
};

const isPicked = (option: string, values: string[], groups: Share): boolean => {
  const served = Object.hasOwn(groups, option) ? stringsOf(groups, option) : [option];
  const offValue = option.slice(0, -'-off'.length);
  const absent = option.endsWith('-off') && !values.includes(offValue);

  return absent || served
    .some((value) => {
      return values.includes(value);
    });
};

// `folder` itself, its `base`, and each value folder its questions pick, at any depth.
const foldersUnder = async (root: string, folder: string, given: Given): Promise<string[]> => {
  const names = await directoriesIn(join(root, folder));
  const perName = names
    .map(async (name) => {
      const path = `${folder}/${name}`;

      if (name === 'base') {
        return await foldersUnder(root, path, given);
      }

      const values = given[name];

      if (values === undefined) {
        return [];
      }

      const groups = await groupsOf(root, path);
      const options = await directoriesIn(join(root, path));
      const picked = options
        .filter((option) => {
          return isPicked(option, values, groups);
        })
        .map(async (option) => {
          return await foldersUnder(root, `${path}/${option}`, given);
        });
      const nested = await Promise.all(picked);

      return nested.flat();
    });
  const nested = await Promise.all(perName);

  const folders = [folder, ...nested.flat()];

  return folders;
};

// `layer` is a path under `root` (`kit/react`); each picked folder reads as a drawer, less its nested folders.
export const layerReader = async (root: string, layer: string, given: Given, withTests: boolean): Promise<Drawn[]> => {
  const folders = await foldersUnder(root, layer, given);
  const nestedRoots = ['base', ...Object.keys(given)]
    .map((name) => {
      return `${name}/`;
    });
  const reads = folders
    .map(async (folder) => {
      const drawn = await drawerReader(root, folder, withTests);
      const files = drawn.files
        .filter(({ path }) => {
          return !nestedRoots
            .some((nested) => {
              return path.startsWith(nested);
            });
        });
      const read: Drawn = {
        ...drawn,
        files,
      };

      return read;
    });

  return await Promise.all(reads);
};
