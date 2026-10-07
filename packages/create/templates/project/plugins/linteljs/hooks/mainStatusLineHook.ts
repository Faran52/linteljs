// `statusLine` in `.claude/settings.json`: the main session's context as a badge.
import { badgeOf, mainContextOf } from './utils/contextUtils.ts';
import { readPayload } from './utils/hostUtils.ts';

const payload = readPayload() ?? {};
const context = mainContextOf(payload);

process.stdout.write(badgeOf(context));
