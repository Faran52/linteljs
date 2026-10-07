// `subagentStatusLine` in `.claude/settings.json`: one JSON line per subagent row, its own context first.
import { subagentRowsOf } from './utils/contextUtils.ts';
import { readPayload } from './utils/hostUtils.ts';

for (const row of subagentRowsOf(readPayload() ?? {})) {
  process.stdout.write(`${JSON.stringify(row)}\n`);
}
