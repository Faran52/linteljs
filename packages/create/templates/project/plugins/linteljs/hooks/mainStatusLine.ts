// `statusLine` in `.claude/settings.json`: the main session's context as a badge.
import { badgeOf, mainContextOf } from './utils/contextUtils.ts';
import { readPayload } from './utils/hostUtils.ts';

process.stdout.write(badgeOf(mainContextOf(readPayload() ?? {})));
