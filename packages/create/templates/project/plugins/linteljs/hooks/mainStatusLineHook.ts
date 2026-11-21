// `statusLine` in `.claude/settings.json`: the main session's context and model as badges.
import { mainBadgesOf } from './utils/contextUtils.ts';
import { readPayload } from './utils/hostUtils.ts';

process.stdout.write(mainBadgesOf(readPayload() ?? {}));
