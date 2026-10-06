import { generatedFileReason } from './utils/generatedFileUtils.ts';
import {
  readEdit,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const payload = readPayload();
const input = payload === undefined ? undefined : readEdit(payload);

if (input !== undefined) {
  writeDecision(input.host, 'deny', generatedFileReason(input));
}
