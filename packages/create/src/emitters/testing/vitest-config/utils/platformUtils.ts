import { type TestPlatform } from '@targets';

export const quoted = (values: string[]): string => {
  return values
    .map((value) => {
      return `'${value}'`;
    })
    .join(', ');
};

// One argument per line: the extension lists run past `max-len`.
export const platformEntries = (platforms: TestPlatform[]): string => {
  return platforms
    .map((platform) => {
      const lines = [
        `        '${platform.name}',`,
        `        [${quoted(platform.extensions)}],`,
        `        [${quoted(platform.include)}],`,
      ];

      return `      platform(\n${lines.join('\n')}\n      ),`;
    })
    .join('\n');
};
