import { hasTests } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

import type { Answers, PackageManager } from '../../model/answers/answers';

// Only npm and bun need `run` for a script that is not `test`.
export const RUN_PREFIX: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm run',
  yarn: 'yarn',
  bun: 'bun run',
};

// Shared with the fix pass; SFC extensions included because `src/**/*.css` matches none of a Vue project's styles.
export const styleGlob = (answers: Answers): string => {
  const { sfcExtension } = targetFor(answers);

  return sfcExtension === undefined ? 'src/**/*.css' : `src/**/*.{css,${sfcExtension}}`;
};

// What the type floor scans, spelled the way `find -name` takes it; SFC and `.astro` join the script extensions.
const bannedPatternNames = (answers: Answers): string[] => {
  const { astro, sfcExtension } = targetFor(answers);

  return [
    "-name '*.ts'",
    "-name '*.tsx'",
    ...(astro === true ? ["-name '*.astro'"] : []),
    ...(sfcExtension === undefined ? [] : [`-name '*.${sfcExtension}'`]),
  ];
};

// `check` is named in the return type so callers need no unreachable `?? ''`.
export const buildScripts = (answers: Answers): Record<string, string> & { check: string } => {
  const run = RUN_PREFIX[answers.packageManager];
  const target = targetFor(answers);
  const gates = ['lint', 'lint:types', 'lint:css', 'typecheck'];

  const scripts: Record<string, string> = {
    'lint': 'eslint .',
    'lint:fix': 'eslint . --fix',
    // The type floor as a gate, since lint-staged scans staged files only. `find`, because the index does not see a
    // newly added file.
    'lint:types': `find src -type f \\( ${bannedPatternNames(answers).join(' -o ')} \\)`
      + ' -exec node scripts/checkBannedPatterns.ts {} +',
    // Measured: 87 stylelint findings in starter CSS passed check without it. `--allow-empty-input`, since stylelint
    // exits 2 on a glob matching nothing.
    'lint:css': `stylelint "${styleGlob(answers)}" --allow-empty-input`,
    // The recess-order config is almost entirely auto-fixable.
    'lint:css:fix': `stylelint "${styleGlob(answers)}" --fix --allow-empty-input`,
    'typecheck': target.typecheck,
  };

  Object.assign(scripts, target.extraScripts);

  if (hasTests(answers)) {
    // vitest exits 1 on an empty run; test:coverage stays strict, since check uses it.
    scripts['test'] = 'vitest run --passWithNoTests';
    scripts['test:coverage'] = 'vitest run --coverage';
    gates.push('test:coverage');
  }

  // `build` comes from the scaffolder for most targets; a target with none is a gap, not a shape.
  if (target.build !== undefined) {
    scripts['build'] = target.build;
  }

  gates.push('build');

  return {
    ...scripts,
    check: gates
      .map((gate) => {
        return `${run} ${gate}`;
      })
      .join(' && '),
    // husky installs the hooks on `install`; a target's own step runs first. Yarn 2+ never runs `prepare`, only
    // `postinstall`, so the same line moves there: measured on SvelteKit, whose `svelte-kit sync` otherwise never ran.
    [answers.packageManager === 'yarn' ? 'postinstall' : 'prepare']:
      target.prepare === undefined ? 'husky' : `${target.prepare} && husky`,
  };
};
