import { bannedPatternReason } from './utils/bannedPatternUtils.ts';
import {
  readEdit,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const payload = readPayload();
const input = payload === undefined ? undefined : readEdit(payload);

if (input !== undefined) {
  writeDecision(input.host, 'block', bannedPatternReason(input, process.env['CLAUDE_PROJECT_DIR']));
}
