import { type Catalog } from '../../read/catalog/catalogReader';
import { type Answered } from '../../read/manifest/manifestReader';
import { drawersIn, givenValues } from '../../utils/drawerUtils';

// `<dir>/<drawer>` for `base` and each answered value's drawer, `any` first.
export const drawersPick = (catalog: Catalog, answered: Answered): string[] => {
  return drawersIn(catalog, answered)
    .filter((drawer) => {
      if (drawer.key === null) {
        return true;
      }

      const values = givenValues(answered, drawer.key);

      return values.includes(drawer.value);
    })
    .map((drawer) => {
      return `${drawer.dir}/${drawer.name}`;
    });
};
