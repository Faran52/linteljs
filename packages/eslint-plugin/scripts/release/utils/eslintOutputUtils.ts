import { execFile } from 'node:child_process';
import { execPath } from 'node:process';
import { promisify } from 'node:util';

// Written out because the majors under test predate its types.
export interface LintMessage {
  ruleId: string | null;
  fatal?: boolean;
}

export interface LintResult {
  messages: LintMessage[];
  output?: string;
}

const execFileAsync = promisify(execFile);

const STDOUT_PREVIEW_CHARS = 200;

const isLintResult = (value: unknown): value is LintResult => {
  return typeof value === 'object' && value !== null && 'messages' in value && Array.isArray(value.messages);
};

const streamOf = (error: unknown, name: 'stderr' | 'stdout'): string => {
  const value: unknown = error instanceof Error && name in error ? Reflect.get(error, name) : undefined;

  return typeof value === 'string' ? value : '';
};

// ESLint exits non-zero whenever it reports; only output that will not parse fails.
// A lint with findings exits non-zero and still prints its JSON.
const stdoutOfFailure = (error: unknown): string => {
  const stdout = streamOf(error, 'stdout');

  if (stdout.trim() === '') {
    throw new Error(`eslint produced no parseable output:\n${streamOf(error, 'stderr')}`, { cause: error });
  }

  return stdout;
};

export const lintResultOf = async (args: string[], cwd: string): Promise<LintResult> => {
  let stdout: string;

  try {
    ({ stdout } = await execFileAsync(execPath, args, {
      cwd,
      encoding: 'utf8',
    }));
  }
  catch (error) {
    stdout = stdoutOfFailure(error);
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
