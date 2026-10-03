// Usage: mutationSummaryAudit.ts <mutation.json> <title>. Writes to the log and, in CI, the job summary.
import {
  appendFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import process from 'node:process';

import { log, logError } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';

import {
  logLinesFor,
  markdownFor,
  unkilledIn,
} from './utils/summaryUtils.ts';

const [reportPath = '', title = 'mutants'] = process.argv.slice(2);

// A run that died before writing its report says so, rather than failing a step that runs on `always()`.
let markdown = `### ${title}\n\nNo report at \`${reportPath}\`: the run ended before writing one.\n`;

if (existsSync(reportPath)) {
  const reportJson = readFileSync(reportPath, 'utf8');
  const unkilled = unkilledIn(JSON.parse(reportJson));

  for (const line of logLinesFor(unkilled)) {
    logError(line);
  }

  log(`${String(unkilled.length)} mutants not killed in ${reportPath}`);
  markdown = markdownFor(title, unkilled);
}
else {
  logError(markdown);
}

const summaryPath = process.env['GITHUB_STEP_SUMMARY'];

if (summaryPath !== undefined) {
  appendFileSync(summaryPath, markdown);
}
