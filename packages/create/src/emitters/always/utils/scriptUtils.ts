import { type Answers, hasTests } from '#answers';
import { RUN_PREFIX } from '#config/constants';
import { targetFor } from '#targets';

// `check` is named in the return type so callers need no unreachable `?? ''`.
// `check` is named so callers need no unreachable `?? ''`.
interface CheckScript {
  check: string;
}

// Shared with the fix pass; SFC extensions included because `src/**/*.css` matches none of a Vue project's styles.
export const styleGlob = (answers: Answers): string => {
  const { sfcExtension } = targetFor(answers);

  return sfcExtension === undefined ? 'src/**/*.css' : `src/**/*.{css,${sfcExtension}}`;
};

export const buildScripts = (answers: Answers): Record<string, string> & CheckScript => {
  const run = RUN_PREFIX[answers.packageManager];
  const target = targetFor(answers);
  const gates = ['lint', 'lint:types', 'lint:css', 'typecheck'];

  const scripts: Record<string, string> = {
    'lint': 'eslint .',
    'lint:fix': 'eslint . --fix',
    // The type floor as a gate, since lint-staged scans staged files only. The checker walks `src` itself, so a newly
    // added file the index has not seen is scanned too.
    'lint:types': 'node scripts/checkBannedPatterns.ts src',
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

  scripts['build'] = target.build;
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
