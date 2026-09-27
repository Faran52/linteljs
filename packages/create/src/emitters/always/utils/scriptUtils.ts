import { RUN_PREFIX } from '@config/constants';

import { hasTests } from '@utils/answerUtils';

import { targetFor } from '@targets';

import type { Answers } from '@config/types';

// Named in the return type so callers need no unreachable `?? ''`.
interface CheckScript {
  check: string;
}

// SFC extensions included because `src/**/*.css` matches none of a Vue project's styles.
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
    // lint-staged scans staged files only; the checker walks `src`, so an unstaged new file is scanned too.
    'lint:types': 'node scripts/checkBannedPatterns.ts src',
    // Measured: 87 findings in starter CSS passed check without it. Stylelint exits 2 on an empty glob.
    'lint:css': `stylelint "${styleGlob(answers)}" --allow-empty-input`,
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
    // Yarn 2+ never runs `prepare`, only `postinstall`: measured on SvelteKit, whose `svelte-kit sync` never ran.
    [answers.packageManager === 'yarn' ? 'postinstall' : 'prepare']:
      target.prepare === undefined ? 'husky' : `${target.prepare} && husky`,
  };
};
