import type { PackageManager } from '@answers';
import type { ScaffoldKind, ScaffoldSpec } from '@targets';

// A tuple, so the first element is a command with no `undefined` guard.
type CommandLine = [string, ...string[]];

// Four spellings of the same intent; wrong, it reads as installing a package called `vite my-app`.
const SCAFFOLD_COMMANDS: Record<PackageManager, Record<ScaffoldKind, CommandLine>> = {
  pnpm: {
    create: ['pnpm', 'create'],
    dlx: ['pnpm', 'dlx'],
  },
  npm: {
    // `--yes` on both: `npm create` is `npm exec`, which asks before caching a scaffolder it does not have. Behind a
    // pipe it warns and proceeds, so the end-to-end suite never saw it; on a terminal it stops and waits for a y.
    create: ['npm', 'create', '--yes'],
    dlx: ['npx', '--yes'],
  },
  yarn: {
    create: ['yarn', 'create'],
    dlx: ['yarn', 'dlx'],
  },
  bun: {
    create: ['bun', 'create'],
    dlx: ['bunx'],
  },
};

// What the scaffold stage says before it runs: the package it fetches and the manager that fetches it.
export const scaffoldNotice = (packageManager: PackageManager, spec: ScaffoldSpec): string => {
  const [scaffolder] = spec.args;
  // `expo-app@latest` names a version and `@angular/cli@latest` names a scope as well, so only a later `@` is one.
  const at = scaffolder.lastIndexOf('@');
  const name = at > 0 ? scaffolder.slice(0, at) : scaffolder;

  return spec.kind === 'create'
    ? `installing create-${name} through ${packageManager}`
    : `running ${name} through ${packageManager}`;
};

export const scaffoldCommand = (
  packageManager: PackageManager,
  spec: ScaffoldSpec,
): CommandLine => {
  const [scaffolder, name, ...flags] = spec.args;
  // `npm create` keeps the flags for itself unless `--` follows the project name.
  const separator = packageManager === 'npm' && spec.kind === 'create' ? ['--'] : [];

  return [...SCAFFOLD_COMMANDS[packageManager][spec.kind], scaffolder, name, ...separator, ...flags];
};
