import { eslintFixReason } from './utils/eslintFixUtils.ts';
import {
  readCommand,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const payload = readPayload();
const input = payload === undefined ? undefined : readCommand(payload, 'postToolUse');

if (input !== undefined) {
  writeDecision(input.host, 'warn', eslintFixReason(input.command, input.dialect));
}
