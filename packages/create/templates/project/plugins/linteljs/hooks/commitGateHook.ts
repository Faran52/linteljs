import { commitGateReason, startCheck } from './utils/checkGateUtils.ts';
import { readPayload, writeDecision } from './utils/hostUtils.ts';

const payload = readPayload();

if (payload !== undefined) {
  startCheck(payload);
  writeDecision('claude', 'deny', commitGateReason(payload));
}
