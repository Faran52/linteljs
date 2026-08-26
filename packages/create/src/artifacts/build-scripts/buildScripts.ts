import { hasTests } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

import type { Answers, PackageManager } from '../../model/answers/answers';

// `pnpm test` works; `npm test` works but `npm lint` does not. Only npm and bun need `run`.
export const RUN_PREFIX: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm run',
  yarn: 'yarn',
  bun: 'bun run',
};

// Exported so `lint:css` and the stage-6 fix pass can't disagree about what the gate covers.
// SFC extensions are included because `src/**/*.css` matches none of a Vue or Svelte project's styles.
export const styleGlob = (answers: Answers): string => {
  const { sfcExtension } = targetFor(answers);

  return sfcExtension === undefined ? 'src/**/*.css' : `src/**/*.{css,${sfcExtension}}`;
};

/**
 * The source extensions the type floor scans, named the way `find -name` takes them. An SFC is where a Vue or Svelte
 * project's logic lives, so its extension joins the script ones; `.astro` joins for the target whose components are
 * templates.
 */
const bannedPatternNames = (answers: Answers): string[] => {
  const { astro, sfcExtension } = targetFor(answers);

  return [
    "-name '*.ts'",
    "-name '*.tsx'",
    ...(astro === true ? ["-name '*.astro'"] : []),
    ...(sfcExtension === undefined ? [] : [`-name '*.${sfcExtension}'`]),
  ];
};

// check is named in the return type so callers need no unreachable, type-demanded `?? ''` fallback.
export const buildScripts = (answers: Answers): Record<string, string> & { check: string } => {
  const run = RUN_PREFIX[answers.packageManager];
  const target = targetFor(answers);
  const gates = ['lint', 'lint:types', 'lint:css', 'typecheck'];

  const scripts: Record<string, string> = {
    'lint': 'eslint .',
    'lint:fix': 'eslint . --fix',
    /**
     * The type floor as a gate of its own: lint-staged runs it over staged files only, so without this `check`
     * passes on code the commit then rejects. `find`, not `git ls-files`, because the index does not see a newly
     * added file, which is exactly the case during active development.
     */
    'lint:types': `find src -type f \\( ${bannedPatternNames(answers).join(' -o ')} \\)`
      + ' -exec node scripts/checkBannedPatterns.ts {} +',
    // A real gate, not a dead script: without it, 87 stylelint findings in starter CSS passed check unnoticed.
    // `--allow-empty-input` because stylelint exits 2 on a glob that matches nothing.
    'lint:css': `stylelint "${styleGlob(answers)}" --allow-empty-input`,
    // The fixing counterpart to `lint:fix`: the recess-order config is almost entirely auto-fixable, and an agent
    // told to run fixes rather than bare lint needs a script to comply with.
    'lint:css:fix': `stylelint "${styleGlob(answers)}" --fix --allow-empty-input`,
    'typecheck': target.typecheck,
  };

  // A target's own extras, before the gates below so `check` still reads as the gate list.
  Object.assign(scripts, target.extraScripts);

  if (hasTests(answers)) {
    // vitest exits 1 on an empty run (hence --passWithNoTests); test:coverage stays strict, since check uses it.
    scripts['test'] = 'vitest run --passWithNoTests';
    scripts['test:coverage'] = 'vitest run --coverage';
    gates.push('test:coverage');
  }

  // build comes from the scaffolder for most targets; the gate stays unconditional, since a target with none
  // is a gap, not a shape to accommodate.
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
    // husky installs the hooks on `install`; without this the .husky/ files sit there inert. A target's own `prepare`
    // runs first, not replaced: SvelteKit's writes .svelte-kit/tsconfig.json, which the emitted tsconfig extends.
    prepare: target.prepare === undefined ? 'husky' : `${target.prepare} && husky`,
  };
};
