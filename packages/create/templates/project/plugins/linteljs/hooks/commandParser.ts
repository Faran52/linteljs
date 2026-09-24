// Reads a Bash hook payload on stdin and answers whether its command is a banned git operation or eslint without --fix.
// Usage: node --experimental-strip-types commandParser.ts git|eslint
import { readFileSync } from 'node:fs';

type Mode = 'eslint' | 'git';
type Decision = typeof CLEAR | typeof INDETERMINATE | typeof MATCH;

interface TokenizerState {
  active: boolean;
  quote: string;
  segments: string[][];
  token: string;
  tokens: string[];
}

interface Inspection {
  index: number;
  result: Decision;
  terminal?: boolean;
  tokens?: string[];
}

interface EnvOption {
  index: number;
  result: Decision;
  splitString?: string;
}

interface EnvInspection {
  index: number;
  result: Decision;
  tokens: string[];
}

interface ToolInput {
  command: string;
}

interface BashPayload {
  tool_input: ToolInput;
}

const CLEAR = 'clear';
const INDETERMINATE = 'indeterminate';
const MATCH = 'match';
const MAX_DEPTH = 8;

// A payload is whatever the host sent, so it is narrowed before its command is read.
const isBashPayload = (value: unknown): value is BashPayload => {
  return typeof value === 'object' && value !== null
    && 'tool_input' in value && typeof value.tool_input === 'object' && value.tool_input !== null
    && 'command' in value.tool_input && typeof value.tool_input.command === 'string';
};

const commandName = (token: string): string => {
  return token.replaceAll('\\', '/').split('/').at(-1)?.toLowerCase() ?? '';
};

const isAssignment = (token: string): boolean => {
  return /^[A-Za-z_]\w*=/u.test(token);
};
const isEslint = (token: string): boolean => {
  return ['eslint', 'eslint.cmd'].includes(commandName(token));
};

const emitToken = (state: TokenizerState): void => {
  if (state.active) {
    state.tokens.push(state.token);
  }
  state.token = '';
  state.active = false;
};

const emitSegment = (state: TokenizerState): void => {
  emitToken(state);
  if (state.tokens.length > 0) {
    state.segments.push(state.tokens);
  }
  state.tokens = [];
};

const readQuotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);
  if (character === state.quote) {
    state.quote = '';
  }
  else if (character === '\\' && state.quote === '"') {
    index += 1;
    if (index >= source.length) {
      return undefined;
    }
    state.token += source.charAt(index);
  }
  else {
    state.token += character;
  }
  state.active = true;
  return index;
};

const readUnquotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);
  if (character === '"' || character === "'") {
    state.quote = character;
    state.active = true;
  }
  else if (character === '\\') {
    index += 1;
    if (index >= source.length) {
      return undefined;
    }
    state.token += source.charAt(index);
    state.active = true;
  }
  else if (character === '#' && !state.active) {
    while (index < source.length && source[index] !== '\n') {
      index += 1;
    }
    emitSegment(state);
  }
  else if (character === '\n') {
    emitSegment(state);
  }
  else if (/\s/u.test(character)) {
    emitToken(state);
  }
  else if (';|&'.includes(character)) {
    emitSegment(state);
    if (source[index + 1] === character) {
      index += 1;
    }
  }
  else {
    state.token += character;
    state.active = true;
  }
  return index;
};

const segmentsOf = (source: string): string[][] | undefined => {
  const state: TokenizerState = {
    active: false,
    quote: '',
    segments: [],
    token: '',
    tokens: [],
  };

  let index = 0;
  while (index < source.length) {
    const next = state.quote === ''
      ? readUnquotedCharacter(source, index, state)
      : readQuotedCharacter(source, index, state);
    if (next === undefined) {
      return undefined;
    }
    index = next + 1;
  }

  if (state.quote !== '') {
    return undefined;
  }
  emitSegment(state);
  return state.segments;
};

const skipOptions = (tokens: string[], start: number, valued: Set<string>): number | undefined => {
  let index = start;

  while ((tokens[index] ?? '').startsWith('-')) {
    const option = tokens[index] ?? '';
    if (option === '--') {
      return index + 1;
    }
    if (valued.has(option)) {
      if (index + 1 >= tokens.length) {
        return undefined;
      }
      index += 2;
    }
    else {
      index += 1;
    }
  }

  return index;
};

const hasExactFix = (arguments_: string[]): boolean => {
  for (const argument of arguments_) {
    if (argument === '--') {
      return false;
    }
    if (argument === '--fix') {
      return true;
    }
  }
  return false;
};

const commitIsBanned = (arguments_: string[]): boolean => {
  for (const argument of arguments_) {
    if (argument === '--') {
      return false;
    }
    if (argument === '--no-verify' || argument === '--amend') {
      return true;
    }
  }
  return false;
};

const addIsBanned = (arguments_: string[]): boolean => {
  let options = true;
  for (const argument of arguments_) {
    if (argument === '--') {
      options = false;
    }
    else if (argument === '.') {
      return true;
    }
    else if (options && (argument === '-A' || argument === '--all'
      || (/^-[^-]/u.test(argument) && argument.slice(1).includes('A')))) {
      return true;
    }
  }
  return false;
};

const gitResult = (tokens: string[], start: number): Decision => {
  if (commandName(tokens[start] ?? '') !== 'git') {
    return CLEAR;
  }
  let index = start + 1;
  const globalValues = new Set([
    '-C',
    '-c',
    '--git-dir',
    '--work-tree',
    '--namespace',
    '--exec-path',
    '--super-prefix',
    '--config-env',
  ]);
  const afterOptions = skipOptions(tokens, index, globalValues);
  if (afterOptions === undefined) {
    return INDETERMINATE;
  }
  index = afterOptions;

  const subcommand = tokens[index]?.toLowerCase();
  const arguments_ = tokens.slice(index + 1);
  if (subcommand === 'stash' || subcommand === 'reset') {
    return MATCH;
  }

  if (subcommand === 'commit' && commitIsBanned(arguments_)) {
    return MATCH;
  }
  if (subcommand === 'add' && addIsBanned(arguments_)) {
    return MATCH;
  }

  return CLEAR;
};

// Only an eslint run without an exact `--fix` before `--` matches.
const fixResult = (arguments_: string[]): Decision => {
  return hasExactFix(arguments_) ? CLEAR : MATCH;
};

const directRunnerResult = (tokens: string[], start: number): Decision => {
  const index = skipOptions(tokens, start, new Set(['-p', '--package']));
  if (index === undefined) {
    return INDETERMINATE;
  }
  return isEslint(tokens[index] ?? '') ? fixResult(tokens.slice(index + 1)) : CLEAR;
};

const scriptRunnerResult = (
  tokens: string[],
  start: number,
  before: Set<string>,
  commands: string[],
  after: Set<string>,
): Decision => {
  let index = skipOptions(tokens, start, before);
  if (index === undefined) {
    return INDETERMINATE;
  }
  if (commands.includes(tokens[index] ?? '')) {
    index += 1;
  }
  index = skipOptions(tokens, index, after);
  if (index === undefined) {
    return INDETERMINATE;
  }
  return isEslint(tokens[index] ?? '') ? fixResult(tokens.slice(index + 1)) : CLEAR;
};

const npmResult = (tokens: string[], start: number): Decision => {
  let index = skipOptions(tokens, start, new Set(['--prefix', '--workspace']));
  if (index === undefined) {
    return INDETERMINATE;
  }
  if (!['exec', 'x', 'run'].includes(tokens[index] ?? '')) {
    return CLEAR;
  }
  index += 1;
  index = skipOptions(tokens, index, new Set(['--package', '-w', '--workspace']));
  if (index === undefined) {
    return INDETERMINATE;
  }
  if (!isEslint(tokens[index] ?? '')) {
    return CLEAR;
  }
  const arguments_ = tokens.slice(index + 1);
  return fixResult(arguments_[0] === '--' ? arguments_.slice(1) : arguments_);
};

const eslintResult = (tokens: string[], start: number): Decision => {
  const executable = commandName(tokens[start] ?? '');
  if (isEslint(tokens[start] ?? '')) {
    return fixResult(tokens.slice(start + 1));
  }
  if (['npx', 'bunx'].includes(executable)) {
    return directRunnerResult(tokens, start + 1);
  }
  if (executable === 'pnpm') {
    return scriptRunnerResult(
      tokens,
      start + 1,
      new Set(['-C', '--dir', '--filter']),
      ['exec', 'dlx', 'run'],
      new Set(['--package']),
    );
  }
  if (executable === 'npm') {
    return npmResult(tokens, start + 1);
  }
  if (executable === 'yarn') {
    return scriptRunnerResult(
      tokens,
      start + 1,
      new Set(['--cwd']),
      ['exec', 'dlx', 'run'],
      new Set<string>(),
    );
  }
  if (executable === 'bun') {
    return scriptRunnerResult(
      tokens,
      start + 1,
      new Set(['--cwd']),
      ['x', 'run'],
      new Set<string>(),
    );
  }
  return CLEAR;
};

const inspectSource = (source: string, mode: Mode, depth: number): Decision => {
  if (depth > MAX_DEPTH) {
    return INDETERMINATE;
  }
  const segments = segmentsOf(source);
  if (segments === undefined) {
    return INDETERMINATE;
  }
  let result: Decision = CLEAR;

  for (const tokens of segments) {
    const segmentResult = inspectSegment(tokens, mode, depth);
    if (segmentResult === MATCH) {
      return MATCH;
    }
    if (segmentResult === INDETERMINATE) {
      result = INDETERMINATE;
    }
  }

  return result;
};

const envOption = (tokens: string[], index: number): EnvOption => {
  const option = tokens[index] ?? '';
  if (option === '-S' || option === '--split-string') {
    const splitString = tokens[index + 1];
    return splitString === undefined
      ? {
          index,
          result: INDETERMINATE,
        }
      : {
          index: index + 2,
          result: CLEAR,
          splitString,
        };
  }
  if (option.startsWith('--split-string=')) {
    return {
      index: index + 1,
      result: CLEAR,
      splitString: option.slice('--split-string='.length),
    };
  }
  if (option.startsWith('-S') && option.length > 2) {
    return {
      index: index + 1,
      result: CLEAR,
      splitString: option.slice(2),
    };
  }
  if (option === '-P') {
    return index + 1 >= tokens.length
      ? {
          index,
          result: INDETERMINATE,
        }
      : {
          index: index + 2,
          result: CLEAR,
        };
  }
  if (option.startsWith('-P') && option.length > 2) {
    return {
      index: index + 1,
      result: CLEAR,
    };
  }
  if (['-u', '--unset', '-C', '--chdir', '-a', '--argv0'].includes(option)) {
    return index + 1 >= tokens.length
      ? {
          index,
          result: INDETERMINATE,
        }
      : {
          index: index + 2,
          result: CLEAR,
        };
  }
  if (['-', '-0', '--null', '-i', '--ignore-environment', '-v', '--debug'].includes(option)) {
    return {
      index: index + 1,
      result: CLEAR,
    };
  }
  return {
    index,
    result: INDETERMINATE,
  };
};

// A split string is one command: none at all, or several, is not something env would run as this one.
const splitEnvArguments = (splitString: string, trailing: string[]): string[] | undefined => {
  const [first, ...rest] = segmentsOf(splitString) ?? [];
  return first === undefined || rest.length > 0 ? undefined : [...first, ...trailing];
};

const inspectEnv = (tokens: string[], start: number, depth: number): EnvInspection => {
  if (depth > MAX_DEPTH) {
    return {
      index: start,
      result: INDETERMINATE,
      tokens,
    };
  }
  let index = start;
  while (index < tokens.length) {
    const option = tokens[index] ?? '';
    if (option === '--') {
      return {
        index: index + 1,
        result: CLEAR,
        tokens,
      };
    }
    if (isAssignment(option) || !option.startsWith('-')) {
      return {
        index,
        result: CLEAR,
        tokens,
      };
    }

    const inspected = envOption(tokens, index);
    if (inspected.result !== CLEAR) {
      return {
        ...inspected,
        tokens,
      };
    }
    index = inspected.index;
    if (inspected.splitString !== undefined) {
      const effective = splitEnvArguments(inspected.splitString, tokens.slice(index));
      if (effective === undefined) {
        return {
          index,
          result: INDETERMINATE,
          tokens,
        };
      }
      return inspectEnv(effective, 0, depth + 1);
    }
  }
  return {
    index,
    result: CLEAR,
    tokens,
  };
};

const skipAssignments = (tokens: string[], start: number): number => {
  let index = start;
  while (isAssignment(tokens[index] ?? '')) {
    index += 1;
  }
  return index;
};

const commandWrapper = (tokens: string[], start: number): Inspection => {
  let index = start;
  let lookup = false;
  while ((tokens[index] ?? '').startsWith('-')) {
    const option = tokens[index] ?? '';
    if (option === '--') {
      return {
        index: index + 1,
        result: CLEAR,
      };
    }
    if (option.includes('v') || option.includes('V')) {
      lookup = true;
    }
    index += 1;
  }
  return {
    index,
    result: CLEAR,
    terminal: lookup,
  };
};

const execWrapper = (tokens: string[], start: number): Inspection => {
  let index = start;
  while ((tokens[index] ?? '').startsWith('-')) {
    const option = tokens[index] ?? '';
    if (option === '--') {
      return {
        index: skipAssignments(tokens, index + 1),
        result: CLEAR,
      };
    }
    if (option === '-a' || option === '--argv0') {
      if (index + 1 >= tokens.length) {
        return {
          index,
          result: INDETERMINATE,
        };
      }
      index += 2;
    }
    else {
      index += 1;
    }
  }
  return {
    index: skipAssignments(tokens, index),
    result: CLEAR,
  };
};

const optionWrapper = (tokens: string[], start: number, valued: Set<string>): Inspection => {
  const index = skipOptions(tokens, start, valued);
  return index === undefined
    ? {
        index: start,
        result: INDETERMINATE,
      }
    : {
        index: skipAssignments(tokens, index),
        result: CLEAR,
      };
};

const shellWrapper = (tokens: string[], start: number, mode: Mode, depth: number): Inspection => {
  for (let index = start; index < tokens.length; index += 1) {
    const option = tokens[index] ?? '';
    if (option === '--') {
      continue;
    }
    if (/^-[^-]*c/u.test(option)) {
      const command = tokens[index + 1];
      return {
        index,
        result: command === undefined
          ? INDETERMINATE
          : inspectSource(command, mode, depth + 1),
        terminal: true,
      };
    }
    if (!option.startsWith('-')) {
      break;
    }
  }
  return {
    index: start,
    result: CLEAR,
    terminal: true,
  };
};

const wrapperResult = (tokens: string[], index: number, mode: Mode, depth: number): Inspection | undefined => {
  const name = commandName(tokens[index] ?? '');
  if (name === 'env') {
    const result = inspectEnv(tokens, index + 1, depth);
    return {
      ...result,
      index: skipAssignments(result.tokens, result.index),
    };
  }
  if (name === 'command') {
    return commandWrapper(tokens, index + 1);
  }
  if (name === 'exec') {
    return execWrapper(tokens, index + 1);
  }
  if (name === 'nohup') {
    const start = tokens[index + 1] === '--' ? index + 2 : index + 1;
    return {
      index: start,
      result: CLEAR,
    };
  }
  if (name === 'sudo') {
    return optionWrapper(tokens, index + 1, new Set([
      '-u', '--user', '-g', '--group', '-h', '--host', '-p', '--prompt',
      '-C', '--close-from', '-r', '--role', '-t', '--type',
    ]));
  }
  if (name === 'time') {
    return optionWrapper(tokens, index + 1, new Set(['-f', '--format', '-o', '--output']));
  }
  if (['sh', 'bash', 'zsh', 'dash', 'ksh'].includes(name)) {
    return shellWrapper(tokens, index + 1, mode, depth);
  }
  return undefined;
};

const inspectSegment = (tokens: string[], mode: Mode, depth: number): Decision => {
  let effective = tokens;
  let index = skipAssignments(effective, effective[0] === '!' ? 1 : 0);
  while (index < effective.length) {
    const wrapper = wrapperResult(effective, index, mode, depth);
    if (wrapper === undefined) {
      break;
    }
    if (wrapper.result === INDETERMINATE) {
      return INDETERMINATE;
    }
    if (wrapper.result === MATCH) {
      return MATCH;
    }
    if (wrapper.terminal) {
      return wrapper.result;
    }
    effective = wrapper.tokens ?? effective;
    index = wrapper.index;
  }
  return mode === 'git' ? gitResult(effective, index) : eslintResult(effective, index);
};

// Malformed JSON or a payload with no Bash command is not a command to judge, so both read as nothing.
const commandOf = (): string | undefined => {
  try {
    const payload: unknown = JSON.parse(readFileSync(0, 'utf8'));
    return isBashPayload(payload) ? payload.tool_input.command : undefined;
  }
  catch {
    return undefined;
  }
};

// The `process` global, not an import from `node:process`: that import sets stdin non-blocking, and a large
// payload then fails its read with EAGAIN and reads as no command at all. The 4 MB depth case pins it.
const main = (): void => {
  const mode = process.argv[2];
  if (mode !== 'git' && mode !== 'eslint') {
    process.stdout.write(INDETERMINATE);
    return;
  }

  const command = commandOf();
  if (command === undefined) {
    process.stdout.write('silent');
    return;
  }

  try {
    const result = inspectSource(command, mode, 0);
    let decision: string = result;
    if (result === MATCH) {
      decision = mode === 'git' ? 'deny' : 'warn';
    }
    process.stdout.write(decision);
  }
  catch {
    process.stdout.write(INDETERMINATE);
  }
};

main();
