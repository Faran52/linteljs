import { execFile } from 'node:child_process';
import { execPath } from 'node:process';

// Written out because the majors under test predate its types.
export interface LintMessage {
  ruleId: string | null;
  fatal?: boolean;
}

export interface LintResult {
  messages: LintMessage[];
  output?: string;
}

interface Run {
  error: Error | null;
  stdout: string;
  stderr: string;
}

const STDOUT_PREVIEW_CHARS = 200;

const isLintResult = (value: unknown): value is LintResult => {
  return typeof value === 'object' && value !== null && 'messages' in value && Array.isArray(value.messages);
};

const run = (args: string[], cwd: string): Promise<Run> => {
  return new Promise((resolve) => {
    execFile(execPath, args, { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
      });
    });
  });
};

// ESLint exits non-zero whenever it reports; only output that will not parse fails.
export const lintResultOf = async (args: string[], cwd: string): Promise<LintResult> => {
  const {
    error,
    stdout,
    stderr,
  } = await run(args, cwd);

  if (stdout.trim() === '') {
    throw new Error(`eslint produced no parseable output:\n${stderr}`, { cause: error });
  }

  const parsed: unknown = JSON.parse(stdout);
  const result: unknown = Array.isArray(parsed) ? parsed.at(0) : undefined;

  if (!isLintResult(result)) {
    throw new Error(`eslint did not answer a JSON result array:\n${stdout.slice(0, STDOUT_PREVIEW_CHARS)}`);
  }

  return result;
};

export const ruleIdsOf = (result: LintResult): (string | null)[] => {
  return result.messages
    .map((message) => {
      return message.ruleId;
    });
};

export const fatalOf = (result: LintResult): LintMessage[] => {
  return result.messages
    .filter((message) => {
      return message.fatal === true;
    });
};
