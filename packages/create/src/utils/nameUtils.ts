import { kebabCase } from 'es-toolkit';

// A scoped package keeps its scope in package.json alone: the directory, title and heading drop it.
export const unscopedName = (name: string): string => {
  return name.replace(/^@[^/]*\//, '');
};

// A monorepo's project name, which is also its directory under apps/ or packages/.
export const projectNameOf = (name: string): string => {
  const unscoped = unscopedName(name);

  return kebabCase(unscoped);
};
