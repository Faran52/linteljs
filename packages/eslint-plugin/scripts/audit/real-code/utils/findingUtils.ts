import { logError } from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';

import type { Finding } from './reportShapeUtils.ts';

export const show = (file: string, finding: Finding, snippet: string, label: string): void => {
  logError([
    `${finding.category}: ${file}`,
    `  rules: ${finding.rules.join(', ')}`,
    `  ${finding.detail}`,
    `  ${label}:`,
    ...snippet
      .split('\n')
      .slice(0, 40)
      .map((line) => {
        return `    ${line}`;
      }),
  ].join('\n'));
};
