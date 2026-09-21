import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  type PackageManager,
  type TargetId,
  type Testing,
} from '@answers';
import { targetFor } from '@targets';

import { scaffoldCommand, scaffoldNotice } from './scaffoldUtils';

// The answers a scaffolder command line reads, plus the two that change which template it asks for.
interface ScaffoldOverrides {
  target?: TargetId;
  packageManager?: PackageManager;
  testing?: Testing;
  libraries?: Library[];
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const answersFor = (overrides: ScaffoldOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const scaffoldFor = (overrides: ScaffoldOverrides): string[] => {
  const answers = answersFor(overrides);

  return scaffoldCommand(
    answers.packageManager,
    targetFor(answers).scaffold('demo-app', answers),
  );
};

describe('scaffoldCommand', () => {
  it('spells create and dlx per package manager', () => {
    const answers = answersFor({ target: 'svelte' });
    const svelte = targetFor(answers).scaffold('demo-app', answers);

    expect(scaffoldFor({})).toEqual([
      'pnpm', 'create', 'vite', 'demo-app',
      '--template', 'react-ts', '--eslint', '--no-interactive', '--no-immediate',
    ]);
    expect(scaffoldCommand('npm', svelte)[0]).toBe('npx');
    expect(scaffoldCommand('bun', svelte)[0]).toBe('bunx');
  });

  // React Native alone: `create-expo-app` shells out to npm whatever launched it, and dies under yarn.
  it('launches through the manager a spec names, not the answered one', () => {
    const answers = answersFor({
      target: 'react-native',
      packageManager: 'yarn',
    });
    const spec = targetFor(answers).scaffold('demo-app', answers);

    expect(scaffoldCommand('yarn', spec)).toEqual([
      'npm', 'create', 'expo-app@latest', 'demo-app', '--', '--yes', '--no-install',
    ]);
    // The separator follows the launcher too, or npm keeps the flags for itself.
    expect(scaffoldCommand('bun', spec)).toContain('--');
  });

  it('inserts -- separator for npm create to forward flags', () => {
    const react = targetFor(answersFor({ target: 'react' })).scaffold('demo-app', answersFor({ target: 'react' }));
    const npm = scaffoldCommand('npm', react);

    expect(npm).toEqual([
      'npm', 'create', 'vite', 'demo-app', '--',
      '--template', 'react-ts', '--eslint', '--no-interactive', '--no-immediate',
    ]);
  });

  it('does not insert -- separator for pnpm, yarn, and bun create', () => {
    const react = targetFor(answersFor({ target: 'react' })).scaffold('demo-app', answersFor({ target: 'react' }));

    expect(scaffoldCommand('pnpm', react)).not.toContain('--');
    expect(scaffoldCommand('yarn', react)).not.toContain('--');
    expect(scaffoldCommand('bun', react)).not.toContain('--');
  });

  // Next wires Tailwind at generate time, so this is the one scaffolder flag that follows the answer.
  it('passes the tailwind answer through to the one generator that acts on it', () => {
    expect(scaffoldFor({
      target: 'next',
      libraries: ['tailwind'],
    })).toContain('--tailwind');
    expect(scaffoldFor({
      target: 'next',
      libraries: ['tailwind'],
    })).not.toContain('--no-tailwind');
    expect(scaffoldFor({
      target: 'next',
      libraries: [],
    })).toContain('--no-tailwind');
  });

  // Three spellings of "TypeScript"; omitting one scaffolds JavaScript under a tsconfig that checks nothing.
  it('asks each generator for TypeScript in its own spelling', () => {
    expect(scaffoldFor({})).toContain('react-ts');
    expect(scaffoldFor({ target: 'next' })).toContain('--ts');
    expect(scaffoldFor({ target: 'vue' })).toContain('--ts');
    expect(scaffoldFor({ target: 'svelte' })).toEqual(expect.arrayContaining(['--types', 'ts']));
  });

  it('leaves --vitest off the vue scaffold when testing is declined', () => {
    expect(scaffoldFor({ target: 'vue' })).toContain('--vitest');
    expect(scaffoldFor({
      target: 'vue',
      testing: 'none',
    })).not.toContain('--vitest');
  });

  // `--yes` promises the tool asks nothing, though four generators ask plenty when handed only a name.
  it('passes each generator its own non-interactive flag', () => {
    const suppressors = [
      '--yes',
      '--defaults',
      '--no-interactive',
      // create-vue skips every prompt once one feature flag is present; --router is the one every answer set passes.
      '--router',
      '--no-add-ons',
    ];

    for (const target of TARGET_IDS) {
      expect([target, scaffoldFor({ target }).some((argument) => {
        return suppressors.includes(argument);
      })]).toEqual([target, true]);
    }
  });

  it('follows the package manager answer where the generator takes one', () => {
    expect(scaffoldFor({
      target: 'next',
      packageManager: 'bun',
    })).toContain('--use-bun');
    expect(scaffoldFor({
      target: 'angular',
      packageManager: 'yarn',
    })).toContain('yarn');
  });
});

describe('scaffoldNotice', () => {
  const noticeFor = (overrides: ScaffoldOverrides): string => {
    const answers = answersFor(overrides);

    return scaffoldNotice(answers.packageManager, targetFor(answers).scaffold('demo-app', answers));
  };

  it('names the package a create scaffolder installs', () => {
    expect(noticeFor({})).toBe('installing create-vite through pnpm');
    expect(noticeFor({ target: 'vue' })).toBe('installing create-vue through pnpm');
  });

  it('names what a dlx scaffolder runs instead', () => {
    expect(noticeFor({
      target: 'svelte',
      packageManager: 'npm',
    })).toBe('running sv through npm');
  });

  it('names the launcher a spec chooses over the answered manager', () => {
    expect(noticeFor({
      target: 'react-native',
      packageManager: 'yarn',
    })).toBe('installing create-expo-app through npm');
  });

  // `expo-app@latest` carries a version and `@angular/cli@latest` carries a scope as well.
  it('drops a version suffix and keeps a scope', () => {
    expect(noticeFor({ target: 'react-native' })).toContain('create-expo-app ');
    expect(noticeFor({ target: 'angular' })).toBe('running @angular/cli through pnpm');
    // A scope is a leading `@` and not a version, so an untagged scoped package keeps all of its name.
    expect(scaffoldNotice('pnpm', {
      kind: 'dlx',
      args: ['@angular/create', 'demo-app'],
    })).toBe('running @angular/create through pnpm');
  });
});
