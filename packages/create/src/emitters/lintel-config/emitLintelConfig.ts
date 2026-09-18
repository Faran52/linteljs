import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from '../../answers/lintelConfig';

import type { Answers } from '../../answers/answers';

// The envelope every recorded project carries, so `sync` and `create --skip-scaffold` replan from what it says.
export const emitLintelConfig = (answers: Answers): string => {
  return `${JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...answers,
  }, null, 2)}\n`;
};
