// A scoped package keeps its scope in package.json alone: the directory, title and heading drop it.
export const unscopedName = (name: string): string => {
  return name.replace(/^@[^/]*\//, '');
};
