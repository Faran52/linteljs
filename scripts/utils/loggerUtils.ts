import { env } from 'node:process';

const isDebug = (): boolean => {
  return env['DEBUG'] === 'true';
};

export const log = (message: string): void => {
  console.log(`[INFO] ${message}`);
};

export const logDebug = (message: string): void => {
  if (isDebug()) {
    console.log(`[DEBUG] ${message}`);
  }
};

export const logWarn = (message: string): void => {
  console.warn(`[WARN] ${message}`);
};

export const logError = (message: string, error?: Error): void => {
  console.error(`[ERROR] ${message}`);

  if (error !== undefined) {
    console.error(`Error details: ${error.message}`);
  }

  if (error?.stack !== undefined && isDebug()) {
    console.error(`Stack trace:\n${error.stack}`);
  }
};
