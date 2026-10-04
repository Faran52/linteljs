import { gitSafetyReason } from './utils/gitSafetyUtils.ts';
import {
  readCommand,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const payload = readPayload();
const input = payload === undefined ? undefined : readCommand(payload, 'beforeShellExecution');

if (input !== undefined) {
  writeDecision(input.host, 'deny', gitSafetyReason(input.command, input.dialect));
}
