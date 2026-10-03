// `undefined` means the command could not be read.
export type Dialect = 'bash' | 'powershell';

export interface ParsedCommand {
  tokens: string[];
  // Part of the command is computed where it runs (a PowerShell subexpression or `Start-Process`), so no guard can
  // vouch for what it is.
  opaque: boolean;
}

interface Segment {
  opaque: boolean;
  tokens: string[];
}

interface TokenizerState {
  active: boolean;
  dialect: Dialect;
  groups: Segment[];
  opaque: boolean;
  quote: string;
  segments: Segment[];
  token: string;
  tokens: string[];
}

interface NestedStep {
  kind: 'nested';
  commands: ParsedCommand[];
}

interface NextStep {
  kind: 'next';
  index: number;
  opaque?: boolean;
  tokens?: string[];
}

interface NoWrapperStep {
  kind: 'none';
}

interface UnreadableStep {
  kind: 'unreadable';
}

type Step = NestedStep | NextStep | NoWrapperStep | UnreadableStep;

const MAX_DEPTH = 8;
const UNREADABLE: Step = { kind: 'unreadable' };
const NO_WRAPPER: Step = { kind: 'none' };

// `C:\Git\cmd\git.exe` and `/usr/bin/git` are both `git`: Windows spells a binary with its extension.
export const commandName = (token: string): string => {
  const path = token.replaceAll('\\', '/');

  return path
    .slice(path.lastIndexOf('/') + 1)
    .toLowerCase()
    .replace(/\.(?:exe|cmd|bat)$/u, '');
};

export const skipOptions = (tokens: string[], start: number, valued: Set<string>): number | undefined => {
  let index = start;
  let option = tokens[index];

  while (option?.startsWith('-') === true) {
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

    option = tokens[index];
  }

  return index;
};

const isAssignment = (token: string): boolean => {
  return /^[A-Za-z_]\w*=/u.test(token);
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
    state.segments.push({
      opaque: state.opaque,
      tokens: state.tokens,
    });
  }

  state.tokens = [];
  state.opaque = false;
};

// A PowerShell group is read as the commands inside it, and the command it sits in cannot be vouched for.
const openGroup = (state: TokenizerState): void => {
  emitToken(state);

  state.groups.push({
    opaque: true,
    tokens: state.tokens,
  });

  state.tokens = [];
  state.opaque = false;
};

const closeGroup = (state: TokenizerState): boolean => {
  emitSegment(state);
  const outer = state.groups.pop();

  if (outer === undefined) {
    return false;
  }

  state.tokens = outer.tokens;
  state.opaque = outer.opaque;
  return true;
};

const escapeCharacter = (state: TokenizerState): string => {
  return state.dialect === 'bash' ? '\\' : '`';
};

const readQuotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);

  if (character === state.quote) {
    // PowerShell doubles a quote to escape it.
    if (state.dialect === 'powershell' && source[index + 1] === character) {
      state.token += character;
      return index + 1;
    }

    state.quote = '';
  }
  else if (character === escapeCharacter(state) && state.quote === '"') {
    index += 1;

    if (index >= source.length) {
      return undefined;
    }

    state.token += source.charAt(index);
  }
  else if (state.dialect === 'powershell' && state.quote === '"' && source.startsWith('$(', index)) {
    return undefined;
  }
  else {
    state.token += character;
  }

  state.active = true;
  return index;
};

// An escaped line break continues the line, in bash by vanishing and in PowerShell as a space between tokens.
const readEscaped = (source: string, index: number, state: TokenizerState): number => {
  const pair = source.slice(index, index + 2);
  const lineBreak = /^(?:\r\n|\r|\n)/u.exec(pair)?.[0];

  if (lineBreak !== undefined) {
    if (state.dialect === 'powershell') {
      emitToken(state);
    }

    return index + lineBreak.length - 1;
  }

  state.token += source.charAt(index);
  state.active = true;
  return index;
};

const POWERSHELL_GROUP = /^(?:<#|@["'({]|\$\(|[(){}])/u;

const readPowerShellGroup = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);
  const pair = source.slice(index, index + 2);

  if (pair === '<#' || pair === '@"' || pair === "@'") {
    return undefined;
  }

  if (pair === '$(' || pair === '@(' || pair === '@{') {
    openGroup(state);
    return index + 1;
  }

  if (character === '(' || character === '{') {
    openGroup(state);
    return index;
  }

  return closeGroup(state) ? index : undefined;
};

const readPlainCharacter = (source: string, index: number, state: TokenizerState): number => {
  const character = source.charAt(index);

  if (character === '#' && !state.active) {
    const lineEnd = source.indexOf('\n', index);
    emitSegment(state);
    return lineEnd === -1 ? source.length : lineEnd;
  }

  if (character === '\n') {
    emitSegment(state);
  }
  else if (/\s/u.test(character)) {
    emitToken(state);
  }
  else if (';|&'.includes(character)) {
    emitSegment(state);
    return source[index + 1] === character ? index + 1 : index;
  }
  else {
    state.token += character;
    state.active = true;
  }

  return index;
};

const readUnquotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const pair = source.slice(index, index + 2);

  if (state.dialect === 'powershell' && POWERSHELL_GROUP.test(pair)) {
    return readPowerShellGroup(source, index, state);
  }

  const character = source.charAt(index);

  if (character === '"' || character === "'") {
    state.quote = character;
    state.active = true;
    return index;
  }

  if (character === escapeCharacter(state)) {
    return index + 1 < source.length ? readEscaped(source, index + 1, state) : undefined;
  }

  return readPlainCharacter(source, index, state);
};

const segmentsOf = (source: string, dialect: Dialect): Segment[] | undefined => {
  const state: TokenizerState = {
    active: false,
    dialect,
    groups: [],
    opaque: false,
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

  if (state.quote !== '' || state.groups.length > 0) {
    return undefined;
  }

  emitSegment(state);
  return state.segments;
};

const skipAssignments = (tokens: string[], start: number): number => {
  let index = start;

  while (isAssignment(tokens[index] ?? '')) {
    index += 1;
  }

  return index;
};

const next = (index: number): Step => {
  const step: Step = {
    kind: 'next',
    index,
  };

  return step;
};

const valuedOperand = (tokens: string[], index: number): Step => {
  return index + 1 >= tokens.length ? UNREADABLE : next(index + 2);
};

// A split string is one command: none at all, or several, is not something env would run as this one.
const splitEnvArguments = (splitString: string, trailing: string[]): string[] | undefined => {
  const [first, ...rest] = segmentsOf(splitString, 'bash') ?? [];

  if (first === undefined || rest.length > 0 || first.opaque) {
    return undefined;
  }

  const splitArguments = [...first.tokens, ...trailing];

  return splitArguments;
};

const splitStringOf = (option: string, operand: string | undefined): string | undefined => {
  if (option === '-S' || option === '--split-string') {
    return operand;
  }

  if (option.startsWith('--split-string=')) {
    return option.slice('--split-string='.length);
  }

  return option.startsWith('-S') ? option.slice(2) : undefined;
};

const envOption = (tokens: string[], index: number, option: string): Step => {
  const valuedOptions = [
    '-u',
    '--unset',
    '-C',
    '--chdir',
    '-a',
    '--argv0',
  ];
  const flagOptions = [
    '-',
    '-0',
    '--null',
    '-i',
    '--ignore-environment',
    '-v',
    '--debug',
  ];

  if (option === '-P' || valuedOptions.includes(option)) {
    return valuedOperand(tokens, index);
  }

  if (option.startsWith('-P') && option.length > 2) {
    return next(index + 1);
  }

  if (flagOptions.includes(option)) {
    return next(index + 1);
  }

  return UNREADABLE;
};

// `-S` splits its operand into the command env runs, so the command is read again from the split words.
const envSplit = (tokens: string[], index: number, option: string, depth: number): Step | undefined => {
  const separate = option === '-S' || option === '--split-string';
  const splitString = splitStringOf(option, tokens[index + 1]);

  if (splitString === undefined) {
    return separate ? UNREADABLE : undefined;
  }

  const effective = splitEnvArguments(splitString, tokens.slice(index + (separate ? 2 : 1)));
  return effective === undefined ? UNREADABLE : envWrapper(effective, 0, depth + 1);
};

const envWrapper = (tokens: string[], start: number, depth: number): Step => {
  if (depth > MAX_DEPTH) {
    return UNREADABLE;
  }

  let index = start;
  let option = tokens[index];

  while (option !== undefined) {
    if (option === '--') {
      index += 1;
      break;
    }

    if (isAssignment(option) || !option.startsWith('-')) {
      break;
    }

    const split = envSplit(tokens, index, option, depth);

    if (split !== undefined) {
      return split;
    }

    const step = envOption(tokens, index, option);

    if (step.kind !== 'next') {
      return step;
    }

    index = step.index;
    option = tokens[index];
  }

  const step: Step = {
    kind: 'next',
    index: skipAssignments(tokens, index),
    tokens,
  };

  return step;
};

const commandWrapper = (tokens: string[], start: number): Step => {
  let index = start;
  let option = tokens[index];

  while (option?.startsWith('-') === true) {
    if (option === '--') {
      return next(index + 1);
    }

    // `command -v` looks a name up rather than running it.
    if (option.includes('v') || option.includes('V')) {
      const lookup: Step = {
        kind: 'nested',
        commands: [],
      };

      return lookup;
    }

    index += 1;
    option = tokens[index];
  }

  return next(index);
};

const execWrapper = (tokens: string[], start: number): Step => {
  let index = start;
  let option = tokens[index];

  while (option?.startsWith('-') === true) {
    if (option === '--') {
      const commandIndex = skipAssignments(tokens, index + 1);

      return next(commandIndex);
    }

    if (option === '-a' || option === '--argv0') {
      if (index + 1 >= tokens.length) {
        return UNREADABLE;
      }

      index += 2;
    }
    else {
      index += 1;
    }

    option = tokens[index];
  }

  const commandIndex = skipAssignments(tokens, index);

  return next(commandIndex);
};

const optionWrapper = (tokens: string[], start: number, valued: Set<string>): Step => {
  const index = skipOptions(tokens, start, valued);

  if (index === undefined) {
    return UNREADABLE;
  }

  const commandIndex = skipAssignments(tokens, index);

  return next(commandIndex);
};

const nested = (source: string, dialect: Dialect, depth: number): Step => {
  const commands = commandsIn(source, dialect, depth + 1);

  if (commands === undefined) {
    return UNREADABLE;
  }

  const step: Step = {
    kind: 'nested',
    commands,
  };

  return step;
};

const NO_COMMAND: Step = {
  kind: 'nested',
  commands: [],
};

const shellWrapper = (tokens: string[], start: number, depth: number): Step => {
  const rest = tokens.slice(start);

  for (const [index, option] of rest.entries()) {
    if (option === '--') {
      continue;
    }

    if (/^-[^-]*c/u.test(option)) {
      const command = rest[index + 1];
      return command === undefined ? UNREADABLE : nested(command, 'bash', depth);
    }

    if (!option.startsWith('-')) {
      break;
    }
  }

  return NO_COMMAND;
};

const POWERSHELL_VALUED = new Set([
  '-configurationname',
  '-custompipename',
  '-executionpolicy',
  '-ex',
  '-ep',
  '-inputformat',
  '-outputformat',
  '-settingsfile',
  '-windowstyle',
  '-workingdirectory',
  '-wd',
  '-version',
]);

// `-c`, `-com` and `-Command` alike: PowerShell accepts any prefix of a parameter name.
const isPrefixOf = (option: string, name: string, shortest: number): boolean => {
  return option.length > shortest && name.startsWith(option);
};

// A PowerShell host reads everything after `-Command` as the command; an encoded one cannot be read at all.
const powerShellWrapper = (tokens: string[], start: number, depth: number): Step => {
  let index = start;

  for (let token = tokens[index]; token !== undefined; token = tokens[index]) {
    const option = token.toLowerCase();

    if (!option.startsWith('-')) {
      const command = tokens
        .slice(index)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (isPrefixOf(option, '-command', 1)) {
      const command = tokens
        .slice(index + 1)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (isPrefixOf(option, '-encodedcommand', 1) || option === '-ec') {
      return UNREADABLE;
    }

    if (isPrefixOf(option, '-file', 1)) {
      return NO_COMMAND;
    }

    index += POWERSHELL_VALUED.has(option) ? 2 : 1;
  }

  return NO_COMMAND;
};

const cmdWrapper = (tokens: string[], start: number, depth: number): Step => {
  const rest = tokens.slice(start);

  for (const [index, token] of rest.entries()) {
    const option = token.toLowerCase();

    if (option === '/c' || option === '/k') {
      const command = rest
        .slice(index + 1)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (!option.startsWith('/')) {
      break;
    }
  }

  return NO_COMMAND;
};

const START_PROCESS_VALUED = new Set([
  '-argumentlist',
  '-args',
  '-credential',
  '-redirectstandarderror',
  '-redirectstandardinput',
  '-redirectstandardoutput',
  '-verb',
  '-windowstyle',
  '-workingdirectory',
]);

// The program is named, but its arguments arrive as a PowerShell array, so the command is opaque.
const startProcessWrapper = (tokens: string[], start: number): Step => {
  let index = start;

  for (let token = tokens[index]; token !== undefined; token = tokens[index]) {
    const option = token.toLowerCase();

    if (option === '-filepath') {
      const step: Step = {
        kind: 'next',
        index: index + 1,
        opaque: true,
      };

      return step;
    }

    if (!option.startsWith('-')) {
      break;
    }

    index += START_PROCESS_VALUED.has(option) ? 2 : 1;
  }

  const step: Step = {
    kind: 'next',
    index,
    opaque: true,
  };

  return step;
};

const wrapperStep = (tokens: string[], index: number, token: string, depth: number): Step => {
  const name = commandName(token);

  if (name === 'env') {
    return envWrapper(tokens, index + 1, depth);
  }

  if (name === 'command') {
    return commandWrapper(tokens, index + 1);
  }

  if (name === 'exec') {
    return execWrapper(tokens, index + 1);
  }

  if (name === 'nohup') {
    return next(tokens[index + 1] === '--' ? index + 2 : index + 1);
  }

  if (name === 'sudo') {
    const sudoValued = new Set([
      '-u',
      '--user',
      '-g',
      '--group',
      '-h',
      '--host',
      '-p',
      '--prompt',
      '-C',
      '--close-from',
      '-r',
      '--role',
      '-t',
      '--type',
    ]);

    return optionWrapper(tokens, index + 1, sudoValued);
  }

  if (name === 'time') {
    const timeValued = new Set([
      '-f',
      '--format',
      '-o',
      '--output',
    ]);

    return optionWrapper(tokens, index + 1, timeValued);
  }

  const shells = [
    'sh',
    'bash',
    'zsh',
    'dash',
    'ksh',
  ];

  if (shells.includes(name)) {
    return shellWrapper(tokens, index + 1, depth);
  }

  if (name === 'pwsh' || name === 'powershell') {
    return powerShellWrapper(tokens, index + 1, depth);
  }

  if (name === 'cmd') {
    return cmdWrapper(tokens, index + 1, depth);
  }

  if (name === 'iex' || name === 'invoke-expression') {
    const start = (tokens[index + 1] ?? '').toLowerCase() === '-command' ? index + 2 : index + 1;
    const command = tokens
      .slice(start)
      .join(' ');
    return nested(command, 'powershell', depth);
  }

  if (name === 'start-process' || name === 'saps' || name === 'start') {
    return startProcessWrapper(tokens, index + 1);
  }

  return NO_WRAPPER;
};

const unwrapSegment = (segment: Segment, depth: number): ParsedCommand[] | undefined => {
  let { tokens, opaque } = segment;
  let index = skipAssignments(tokens, tokens[0] === '!' ? 1 : 0);

  for (let token = tokens[index]; token !== undefined; token = tokens[index]) {
    const step = wrapperStep(tokens, index, token, depth);

    if (step.kind === 'none') {
      break;
    }

    if (step.kind === 'unreadable') {
      return undefined;
    }

    if (step.kind === 'nested') {
      return step.commands;
    }

    tokens = step.tokens ?? tokens;
    index = step.index;
    opaque ||= step.opaque === true;
  }

  const command = tokens.slice(index);

  if (command.length === 0) {
    return [];
  }

  const unwrapped = [{
    tokens: command,
    opaque,
  }];

  return unwrapped;
};

const commandsIn = (source: string, dialect: Dialect, depth: number): ParsedCommand[] | undefined => {
  if (depth > MAX_DEPTH) {
    return undefined;
  }

  const segments = segmentsOf(source, dialect);

  if (segments === undefined) {
    return undefined;
  }

  const commands: ParsedCommand[] = [];

  for (const segment of segments) {
    const unwrapped = unwrapSegment(segment, depth);

    if (unwrapped === undefined) {
      return undefined;
    }

    commands.push(...unwrapped);
  }

  return commands;
};

export const parseCommand = (source: string, dialect: Dialect): ParsedCommand[] | undefined => {
  return commandsIn(source, dialect, 0);
};
