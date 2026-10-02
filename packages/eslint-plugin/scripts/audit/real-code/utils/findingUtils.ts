import { logError } from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import { SNIPPET_LINES_SHOWN } from '../constants.ts';

import type { Finding } from './reportShapeUtils.ts';

export const show = (file: string, finding: Finding, snippet: string, label: string): void => {
  const report = [
    `${finding.category}: ${file}`,
    `  rules: ${finding.rules.join(', ')}`,
    `  ${finding.detail}`,
    `  ${label}:`,
    ...snippet
      .split('\n')
      .slice(0, SNIPPET_LINES_SHOWN)
      .map((line) => {
        return `    ${line}`;
      }),
  ].join('\n');

  logError(report);
};
