import { type AnswerKey } from '@answers';

import { type Catalog, type Drawer } from '../read/catalog/catalogReader';
import { type Answered } from '../read/manifest/manifestReader';

// An answer's values, `none` kept.
export const givenValues = (answered: Answered, key: AnswerKey): string[] => {
  const given = answered[key];

  if (given === undefined) {
    return [];
  }

  const values = [given].flat();

  return values;
};

export const answeredValues = (answered: Answered, key: AnswerKey): string[] => {
  const values = givenValues(answered, key);

  return values
    .filter((value) => {
      return value !== 'none';
    });
};

// The drawers in `any`, then in the styling's directory, plain CSS when none is picked.
export const drawersIn = (catalog: Catalog, answered: Answered): Drawer[] => {
  const [styling = 'css'] = answeredValues(answered, 'styling');
  const dirs = ['any', styling];

  return dirs
    .flatMap((dir) => {
      return catalog.drawers
        .filter((drawer) => {
          return drawer.dir === dir;
        });
    });
};
