import { dependencyReason } from './utils/dependencyUtils.ts';
import {
  hostOf,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const payload = readPayload();

if (payload !== undefined) {
  writeDecision(hostOf(payload), 'ask', dependencyReason(payload));
}
