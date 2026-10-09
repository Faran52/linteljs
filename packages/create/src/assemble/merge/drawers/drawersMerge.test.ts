import { join } from 'node:path';

import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { offersCheck } from '@choices/check/offers/offersCheck';
import { drawersPick } from '@choices/pick/drawers/drawersPick';
import { type Catalog, catalogReader } from '@choices/read/catalog/catalogReader';
import {
  type Answered,
  manifestReader,
  type Question,
} from '@choices/read/manifest/manifestReader';
import { directoriesIn, TEMPLATES_ROOT } from '@disk';

import { drawerReader, type Drawn } from '../../read/drawer/drawerReader';

import { drawersMerge } from './drawersMerge';

const drawnOf = (name: string, paths: string[], share: Drawn['share']): Drawn => {
  const files = paths
    .map((path) => {
      const file = {
        path,
        source: join(name, path),
      };

      return file;
    });
  const drawn: Drawn = {
    name,
    files,
    share,
  };

  return drawn;
};

const combinationsOf = (questions: readonly Question[], catalog: Catalog, target: string): Answered[] => {
  let combinations: Answered[] = [{ target }];

  for (const question of questions) {
    if (question.scope === 'project' && question.key !== 'target') {
      combinations = combinations
        .flatMap((answered) => {
          const offers = offersCheck(catalog, question, answered);
          const picks = question.kind === 'multi' ? [[], offers] : offers;

          if (offers.length === 0) {
            const unchanged = [answered];

            return unchanged;
          }

          const variants = picks
            .map((value) => {
              const picked: Answered = {
                ...answered,
                [question.key]: value,
              };

              return picked;
            });

          return variants;
        });
    }
  }

  return combinations;
};

const clashesIn = async (root: string, framework: string): Promise<string[]> => {
  const questions = await manifestReader();
  const catalog = await catalogReader(questions, root, framework);
  const combinations = combinationsOf(questions, catalog, framework);
  const merges = combinations
    .map(async (answered) => {
      const reads = drawersPick(catalog, answered)
        .map(async (drawer) => {
          return await drawerReader(root, `frameworks/${framework}/${drawer}`, true);
        });
      const drawn = await Promise.all(reads);

      return drawersMerge(drawn);
    });
  const outcomes = await Promise.allSettled(merges);

  return outcomes
    .filter((outcome) => {
      return outcome.status === 'rejected';
    })
    .map((outcome) => {
      return `${framework}: ${String(outcome.reason)}`;
    });
};

describe('drawersMerge', () => {
  it('joins the files in order and folds the shares', () => {
    const merged = drawersMerge([
      drawnOf('a', ['x.ts'], { package: { dependencies: { react: '^19.0.0' } } }),
      drawnOf('b', ['y.ts'], { package: { devDependencies: { vitest: '^4.0.0' } } }),
    ]);
    const paths = merged.files
      .map((file) => {
        return file.path;
      });

    expect(paths).toEqual(['x.ts', 'y.ts']);

    expect(merged.share).toEqual({
      package: {
        dependencies: { react: '^19.0.0' },
        devDependencies: { vitest: '^4.0.0' },
      },
    });
  });

  it('refuses a path two drawers hold, naming both', () => {
    const merging = (): void => {
      drawersMerge([drawnOf('a', ['x.ts'], {}), drawnOf('b', ['x.ts'], {})]);
    };

    expect(merging).toThrow('x.ts is in both a and b');
  });

  it('meets no clash in any legal combination of any framework', async () => {
    const shipped = await directoriesIn(join(TEMPLATES_ROOT, 'frameworks'));
    const checks = [
      clashesIn(DRAWERS_ROOT, 'react'),
      ...shipped
        .map(async (framework) => {
          return await clashesIn(TEMPLATES_ROOT, framework);
        }),
    ];

    const clashes = await Promise.all(checks);
    const flat = clashes.flat();

    expect(flat).toEqual([]);
  });
});
