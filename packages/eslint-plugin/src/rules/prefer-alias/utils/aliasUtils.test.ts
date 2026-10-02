import {
  type Alias,
  aliasedProjectOf,
  aliasHolding,
  aliasMatching,
  matchesGlob,
  pathOf,
  relativeBetween,
  throughAlias,
} from './aliasUtils.ts';

const CONFIG: Alias = {
  prefix: '@config/',
  directory: '/p/src/config',
};

const FLAGS: Alias = {
  prefix: '@config/flags/',
  directory: '/p/src/lib',
};

const NESTED: Alias = {
  prefix: '@nested/',
  directory: '/p/src/config/nested',
};

const UI: Alias = {
  prefix: '@ui/',
  directory: '/p/src/ui',
  exact: '@ui',
};

const TWIN: Alias = {
  prefix: '@twin/',
  directory: '/p/src/config',
};

describe('aliasedProjectOf', () => {
  it('reads nothing off a project with no paths', () => {
    const project = aliasedProjectOf({ pathsBasePath: '/p' });

    expect(project).toBeUndefined();
  });

  it('reads nothing when no base is known', () => {
    const project = aliasedProjectOf({ paths: { '@config/*': ['./src/config/*'] } });

    expect(project).toBeUndefined();
  });

  it('resolves the directories from the tsconfig that declares them', () => {
    const project = aliasedProjectOf({
      paths: { '@config/*': ['./src/config/*'] },
      pathsBasePath: '/p',
    });

    const expected = {
      base: '/p',
      aliases: [CONFIG],
      pinned: [],
    };
    expect(project).toEqual(expected);
  });

  it('pins the exact keys onto a file, not those naming an alias directory', () => {
    const project = aliasedProjectOf({
      paths: {
        '@ui/*': ['./src/ui/*'],
        '@ui': ['./src/ui'],
        '@config/env': ['./src/config/env-file.ts'],
      },
      pathsBasePath: '/p',
    });

    const expected = ['@config/env'];
    expect(project?.pinned).toEqual(expected);
  });

  it('keeps only a trailing-star pattern onto a directory, by its first substitution', () => {
    const project = aliasedProjectOf({
      paths: {
        '@app': ['./src/app/index.ts'],
        '@*/x': ['./src/*/x'],
        '@two/*/*': ['./src/two/*'],
        '@file/*': ['./src/file*'],
        '@star/*': ['./src/*/star/*'],
        '@empty/*': [],
        '@config/*': ['./src/config/*', './src/fallback/*'],
      },
      pathsBasePath: '/p',
    });

    const expected = [CONFIG];
    expect(project?.aliases).toEqual(expected);
  });

  it('pairs a wildcard alias with the exact key onto its directory', () => {
    const project = aliasedProjectOf({
      paths: {
        '@ui/*': ['./src/ui/*'],
        '@ui': ['./src/ui'],
        '@uiStar': ['./src/ui/*'],
        '@config/*': ['./src/config/*'],
        '@elsewhere': ['./src/other'],
        '@config*': ['./src/config'],
      },
      pathsBasePath: '/p',
    });

    const expected = [UI, CONFIG];
    expect(project?.aliases).toEqual(expected);
  });

  it('skips an empty key, and pairs no exact key that has no substitution', () => {
    const project = aliasedProjectOf({
      paths: {
        '': ['./src/config/*'],
        '@root/*': ['./*'],
        '@root': [],
      },
      pathsBasePath: '/p',
    });

    const expected = [{
      prefix: '@root/',
      directory: '/p',
    }];
    expect(project?.aliases).toEqual(expected);

    const expected2 = ['', '@root'];
    expect(project?.pinned).toEqual(expected2);
  });

  it('reads nothing off a project with a baseUrl', () => {
    const project = aliasedProjectOf({
      paths: { '@config/*': ['./src/config/*'] },
      pathsBasePath: '/p',
      baseUrl: '/p',
    });

    expect(project).toBeUndefined();
  });
});

describe('aliasHolding', () => {
  it('picks the deepest directory holding the path', () => {
    const alias = aliasHolding([CONFIG, NESTED], '/p/src/config/nested/a');

    expect(alias).toBe(NESTED);
  });

  it('keeps the first of two equally deep', () => {
    const alias = aliasHolding([CONFIG, TWIN], '/p/src/config/a');

    expect(alias).toBe(CONFIG);
  });

  it('needs the path inside the directory, not beside it', () => {
    const alias = aliasHolding([CONFIG], '/p/src/configs/a');

    expect(alias).toBeUndefined();
  });

  it('does not count the directory itself', () => {
    const alias = aliasHolding([CONFIG], '/p/src/config');

    expect(alias).toBeUndefined();
  });

  it('counts the directory itself when an exact key names it', () => {
    const alias = aliasHolding([CONFIG, UI], '/p/src/ui');

    expect(alias).toBe(UI);
  });
});

describe('aliasMatching', () => {
  it('picks the longest prefix, as TypeScript does', () => {
    const longer = aliasMatching([CONFIG, FLAGS], '@config/flags/on');
    const shorter = aliasMatching([CONFIG, FLAGS], '@config/env');

    expect(longer).toBe(FLAGS);
    expect(shorter).toBe(CONFIG);
  });

  it('takes an exact key before any prefix', () => {
    const ROOT: Alias = {
      prefix: '@',
      directory: '/p/src',
    };
    const alias = aliasMatching([ROOT, UI], '@ui');

    expect(alias).toBe(UI);
  });

  it('matches every specifier through an empty prefix', () => {
    const ANY: Alias = {
      prefix: '',
      directory: '/p/src',
    };
    const alias = aliasMatching([ANY], 'x');

    expect(alias).toBe(ANY);
  });

  it('matches nothing outside every prefix', () => {
    const alias = aliasMatching([CONFIG], 'react');

    expect(alias).toBeUndefined();
  });
});

describe('throughAlias and pathOf', () => {
  it('turn a path into its alias and back', () => {
    const specifier = throughAlias(CONFIG, '/p/src/config/a/b');
    const path = pathOf(CONFIG, specifier);

    expect(specifier).toBe('@config/a/b');
    expect(path).toBe('/p/src/config/a/b');
  });

  it('turn the directory into its exact key and back', () => {
    const specifier = throughAlias(UI, '/p/src/ui');
    const path = pathOf(UI, specifier);
    const unpaired = throughAlias(CONFIG, '/p/src/config/a');

    expect(specifier).toBe('@ui');
    expect(path).toBe('/p/src/ui');
    expect(unpaired).toBe('@config/a');
  });
});

describe('throughAlias', () => {
  it('spells a path below a paired directory through its prefix', () => {
    const specifier = throughAlias(UI, '/p/src/ui/button');

    expect(specifier).toBe('@ui/button');
  });

  it('spells an unpaired directory as its bare prefix', () => {
    const specifier = throughAlias(CONFIG, '/p/src/config');

    expect(specifier).toBe('@config/');
  });
});

describe('relativeBetween', () => {
  it('starts a sibling with ./', () => {
    const relative = relativeBetween('/p/src/a.ts', '/p/src/b');

    expect(relative).toBe('./b');
  });

  it('names this directory as .', () => {
    const relative = relativeBetween('/p/src/a.ts', '/p/src');

    expect(relative).toBe('.');
  });

  it('climbs with ../', () => {
    const relative = relativeBetween('/p/src/x/a.ts', '/p/src/b');

    expect(relative).toBe('../b');
  });

  it('names the parent directory as ..', () => {
    const relative = relativeBetween('/p/src/x/y/a.ts', '/p/src/x');

    expect(relative).toBe('..');
  });

  it('keeps a dot-named sibling below this directory', () => {
    const relative = relativeBetween('/p/src/a.ts', '/p/src/..b');

    expect(relative).toBe('./..b');
  });
});

describe('matchesGlob', () => {
  it.each([
    [
      'src/routes.ts',
      'src/routes.ts',
      true,
    ],
    [
      'src/routes.ts',
      'src/routesXts',
      false,
    ],
    [
      'src/routes.ts',
      'app/src/routes.ts',
      false,
    ],
    [
      'src/*.ts',
      'src/a.ts',
      true,
    ],
    [
      'src/*.ts',
      'src/routes.ts',
      true,
    ],
    [
      'src/*.ts',
      'src/a/b.ts',
      false,
    ],
    [
      'src/**/*.ts',
      'src/a.ts',
      true,
    ],
    [
      'src/**/*.ts',
      'src/a/b/c.ts',
      true,
    ],
    [
      'src/**',
      'src/a/b',
      true,
    ],
    [
      'src/?.ts',
      'src/a.ts',
      true,
    ],
    [
      'src/?.ts',
      'src/ab.ts',
      false,
    ],
    [
      'src/(a).ts',
      'src/(a).ts',
      true,
    ],
    [
      'src/[a].ts',
      'src/a.ts',
      false,
    ],
  ])('%s against %s is %s', (glob, path, expected) => {
    const matched = matchesGlob(glob, path);

    expect(matched).toBe(expected);
  });
});
