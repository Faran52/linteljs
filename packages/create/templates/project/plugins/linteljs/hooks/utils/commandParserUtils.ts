// `undefined` means the command could not be read.
export type Dialect = 'bash' | 'powershell';

export interface ParsedCommand {
  tokens: [string, ...string[]];
  // Part of the command is computed where it runs (a PowerShell subexpression or `Start-Process`), so no guard can
  // vouch for what it is.
  opaque: boolean;
}

interface Segment {
  opaque: boolean;
  tokens: string[];
}

interface Heredoc {
  delimiter: string;
  literal: boolean;
  strip: boolean;
}

// What a group interrupted, restored when it closes.
interface Group extends Segment {
  active: boolean;
  body: Heredoc | undefined;
  closer: string;
  quote: string;
  token: string;
}

interface TokenizerState {
  active: boolean;
  body: Heredoc | undefined;
  dialect: Dialect;
  groups: Group[];
  heredocs: Heredoc[];
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

// Stands in for the output of a bash command substitution inside a token.
export const COMPUTED = '\u0000';

// Words that open or close a bash compound command, after which the next command starts. A `case` pattern's `)`
// is not read: `case` bodies stay a known gap.
const RESERVED = new Set([
  '!',
  '{',
  '}',
  'if',
  'then',
  'else',
  'elif',
  'fi',
  'do',
  'done',
  'while',
  'until',
]);
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
const pushGroup = (state: TokenizerState, group: Group): void => {
  state.groups.push(group);
  state.active = false;
  state.body = undefined;
  state.opaque = false;
  state.quote = '';
  state.token = '';
  state.tokens = [];
};

const openGroup = (state: TokenizerState): void => {
  emitToken(state);

  pushGroup(state, {
    active: false,
    body: undefined,
    closer: '',
    opaque: true,
    quote: '',
    token: '',
    tokens: state.tokens,
  });
};

/**
 * A bash substitution is read as the commands inside it, and leaves COMPUTED in the token it sits in. Unquoted,
 * its output is split into words no guard can count, so that command cannot be vouched for either. A heredoc body
 * is no command's token, so one there leaves nothing.
 */
const openSubstitution = (state: TokenizerState, closer: string): void => {
  const inToken = state.body === undefined;

  pushGroup(state, {
    active: inToken,
    body: state.body,
    closer,
    opaque: state.opaque || (inToken && state.quote === ''),
    quote: state.quote,
    token: inToken ? state.token + COMPUTED : '',
    tokens: state.tokens,
  });
};

// Opens the substitution at `$(` or a backtick, and answers the last character it consumed.
const substitute = (source: string, index: number, state: TokenizerState): number => {
  const backtick = source.charAt(index) === '`';

  openSubstitution(state, backtick ? '`' : ')');
  return backtick ? index : index + 1;
};

const openSubshell = (state: TokenizerState): void => {
  emitToken(state);

  pushGroup(state, {
    active: false,
    body: undefined,
    closer: ')',
    opaque: state.opaque,
    quote: '',
    token: '',
    tokens: state.tokens,
  });
};

const closeGroup = (state: TokenizerState): boolean => {
  emitSegment(state);
  const outer = state.groups.pop();

  if (outer === undefined) {
    return false;
  }

  state.active = outer.active;
  state.body = outer.body;
  state.opaque = outer.opaque;
  state.quote = outer.quote;
  state.token = outer.token;
  state.tokens = outer.tokens;
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
  else if (state.quote === '"' && (source.startsWith('$(', index) || character === '`')) {
    if (state.dialect === 'powershell') {
      return undefined;
    }

    return substitute(source, index, state);
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
    return lineEnd === -1 ? source.length : lineEnd - 1;
  }

  if (character === '\n') {
    emitSegment(state);
    state.body = state.heredocs.shift();
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

// `<<-'EOF'`, `<<"EOF"`, `<<\EOF` and `<<EOF`. A quoted delimiter makes the body literal.
const HEREDOC = /^<<(-?)[ \t]*(?:'([^'\n]*)'|"([^"\n]*)"|\\?([^\s"&'();<>`|]+))(?=[\s&;<>|)]|$)/u;

// The body is read from the line after the redirect, so it is queued until that line ends.
const readHeredoc = (source: string, index: number, state: TokenizerState): number | undefined => {
  const match = HEREDOC.exec(source.slice(index));

  if (match === null) {
    return undefined;
  }

  const [
    redirect,
    strip,
    single,
    double,
    bare,
  ] = match;

  emitToken(state);

  state.heredocs.push({
    delimiter: [
      single,
      double,
      bare,
    ].join(''),
    literal: bare === undefined || redirect.includes('\\'),
    strip: strip === '-',
  });

  return index + redirect.length - 1;
};

const readBashGroup = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);

  if (source.startsWith('<<<', index)) {
    state.token += '<<<';
    state.active = true;
    return index + 2;
  }

  if (source.startsWith('<<', index)) {
    return readHeredoc(source, index, state);
  }

  if (character === state.groups.at(-1)?.closer) {
    closeGroup(state);
    return index;
  }

  if (character === '(') {
    openSubshell(state);
    return index;
  }

  return substitute(source, index, state);
};

// `$(`, `<(`, `>(` and a backtick open a substitution, `(` a subshell where a command can start, and `)` closes
// only what is open, so a `case` pattern stays a character.
const isBashGroup = (source: string, index: number, state: TokenizerState): boolean => {
  const character = source.charAt(index);
  const pair = source.slice(index, index + 2);

  if (/^(?:[$<>]\(|<<|`)/u.test(pair)) {
    return true;
  }

  const closer = state.groups.at(-1)?.closer;
  return (character === '(' && !state.active) || (character === ')' && closer === ')');
};

const readUnquotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const pair = source.slice(index, index + 2);

  if (state.dialect === 'powershell' && POWERSHELL_GROUP.test(pair)) {
    return readPowerShellGroup(source, index, state);
  }

  if (state.dialect === 'bash' && isBashGroup(source, index, state)) {
    return readBashGroup(source, index, state);
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

// A body line is skipped whole when it is literal or the delimiter, and read for substitutions otherwise.
const readBody = (source: string, index: number, state: TokenizerState, body: Heredoc): number => {
  if (source[index - 1] === '\n') {
    const lineEnd = source.indexOf('\n', index);
    const end = lineEnd === -1 ? source.length : lineEnd;
    const line = source
      .slice(index, end)
      .replace(body.strip ? /^\t*/u : /^/u, '')
      .replace(/\r$/u, '');

    if (line === body.delimiter) {
      state.body = state.heredocs.shift();
      return end;
    }

    if (body.literal) {
      return end;
    }
  }

  const character = source.charAt(index);

  if (character === '\\') {
    return index + 1;
  }

  if (character === '`' || source.startsWith('$(', index)) {
    return substitute(source, index, state);
  }

  return index;
};

const readCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  if (state.body !== undefined) {
    return readBody(source, index, state, state.body);
  }

  return state.quote === ''
    ? readUnquotedCharacter(source, index, state)
    : readQuotedCharacter(source, index, state);
};

const segmentsOf = (source: string, dialect: Dialect): Segment[] | undefined => {
  const state: TokenizerState = {
    active: false,
    body: undefined,
    dialect,
    groups: [],
    heredocs: [],
    opaque: false,
    quote: '',
    segments: [],
    token: '',
    tokens: [],
  };

  let index = 0;

  while (index < source.length) {
    const next = readCharacter(source, index, state);

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
  let index = 0;

  while (RESERVED.has(tokens[index] ?? '') || isAssignment(tokens[index] ?? '')) {
    index += 1;
  }

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

  const [executable, ...arguments_] = tokens.slice(index);

  if (executable === undefined) {
    return [];
  }

  const unwrapped: ParsedCommand[] = [{
    tokens: [executable, ...arguments_],
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
