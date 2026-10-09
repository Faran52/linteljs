import { join } from 'node:path';

import { kebabCase, maxBy } from 'es-toolkit';

import { type AnswerKey } from '@answers';
import { directoriesIn } from '@disk';

import { type Question } from '../manifest/manifestReader';

// `base` carries no key; `dir` is `any` or a styling.
export interface Drawer {
  dir: string;
  name: string;
  key: AnswerKey | null;
  value: string;
}

export interface Catalog {
  drawers: Drawer[];
  languages: string[];
  agents: string[];
}

// The longest question prefix wins, so `browser-x` never reads as a `browsers` drawer.
const drawerOf = (questions: readonly Question[], dir: string, name: string): Drawer => {
  if (name === 'base') {
    const base: Drawer = {
      dir,
      name,
      key: null,
      value: '',
    };

    return base;
  }

  const unknown = `Drawer ${name} names no question and value`;
  const prefixed = questions
    .filter((candidate) => {
      return name.startsWith(`${kebabCase(candidate.key)}-`);
    });
  const question = maxBy(prefixed, (candidate) => {
    return candidate.key.length;
  });

  if (question === undefined) {
    throw new Error(unknown);
  }

  const value = name.slice(kebabCase(question.key).length + 1);
  const isNone = value === 'none' && question.none !== undefined;

  if (!isNone && !Object.hasOwn(question.values, value)) {
    throw new Error(unknown);
  }

  const drawer: Drawer = {
    dir,
    name,
    key: question.key,
    value,
  };

  return drawer;
};

// `root` holds `frameworks/<framework>/<dir>/<drawer>/` and `common/{languages,agents}/`.
export const catalogReader = async (
  questions: readonly Question[],
  root: string,
  framework: string,
): Promise<Catalog> => {
  const frameworkDir = join(root, 'frameworks', framework);
  const dirs = await directoriesIn(frameworkDir);
  const perDir = await Promise.all(dirs
    .map(async (dir) => {
      const names = await directoriesIn(join(frameworkDir, dir));

      return names
        .map((name) => {
          return drawerOf(questions, dir, name);
        });
    }));
  const languages = await directoriesIn(join(root, 'common', 'languages'));
  const agents = await directoriesIn(join(root, 'common', 'agents'));
  const found: Catalog = {
    drawers: perDir.flat(),
    languages,
    agents,
  };

  return found;
};
