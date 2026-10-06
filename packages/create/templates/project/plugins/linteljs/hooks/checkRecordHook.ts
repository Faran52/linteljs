import { finishCheck } from './utils/checkGateUtils.ts';
import { readPayload } from './utils/hostUtils.ts';

const payload = readPayload();

if (payload !== undefined) {
  finishCheck(payload);
}
