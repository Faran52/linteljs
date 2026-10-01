import { type TestPlatform } from '@targets';

export const quoted = (values: string[]): string => {
  return values
    .map((value) => {
      return `'${value}'`;
    })
    .join(', ');
};

// Three or more break, as `@linteljs/array-newline` has them.
const listArgument = (values: string[]): string => {
  if (values.length <= 2) {
    return `        [${quoted(values)}],`;
  }

  const items = values
    .map((value) => {
      return `          '${value}',`;
    });

  return [
    '        [',
    ...items,
    '        ],',
  ].join('\n');
};

// One argument per line: the extension lists run past `max-len`.
export const platformEntries = (platforms: TestPlatform[]): string => {
  return platforms
    .map((platform) => {
      const lines = [
        `        '${platform.name}',`,
        listArgument(platform.extensions),
        listArgument(platform.include),
      ];

      return `      platform(\n${lines.join('\n')}\n      ),`;
    })
    .join('\n');
};
