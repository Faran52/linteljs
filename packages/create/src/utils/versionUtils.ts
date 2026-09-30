// No field of a Node version nears a thousand; a range with an upper bound would need more.
export const rankOf = (version: string): number => {
  const [
    major = 0,
    minor = 0,
    patch = 0,
  ] = version
    .split('.')
    .map((field) => {
      return Number.parseInt(field, 10);
    });

  return major * 1_000_000 + minor * 1_000 + patch;
};

export const majorOf = (version: string): number => {
  return Number.parseInt(version, 10);
};
