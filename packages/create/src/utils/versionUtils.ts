// `26.9.0` becomes 26_009_000, so one comparison answers it. No field of a Node version comes near a thousand, and
// this is the whole of the semver support a floor of `>=x.y.z` needs; a range with an upper bound would not be.
export const rankOf = (version: string): number => {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map((field) => {
    return Number.parseInt(field, 10);
  });

  return major * 1_000_000 + minor * 1_000 + patch;
};

// Yarn prints `1.22.22`, pnpm and bun a bare version, npm the same; the major is the first field of all four.
export const majorOf = (version: string): number => {
  return Number.parseInt(version, 10);
};
