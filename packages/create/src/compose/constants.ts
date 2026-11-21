import ts from 'typescript';

// The first character of a line that is not indentation.
export const WRITTEN = /[^\t ]/u;

// A JSX tag that names an HTML element, not a value in scope.
export const INTRINSIC_TAG = /^[a-z]/u;

// How tightly each kind of expression holds together; a higher level binds tighter.
export const LEVEL = {
  comma: 0,
  assignment: 1,
  nullish: 3,
  or: 4,
  and: 5,
  bitOr: 6,
  bitXor: 7,
  bitAnd: 8,
  equality: 9,
  relational: 10,
  shift: 11,
  additive: 12,
  multiplicative: 13,
  exponent: 14,
  unary: 15,
  // `a?.b`, `a++` and `new A` with no arguments: none can be read from or called without parentheses.
  optional: 16,
  // A call, or a member of one: it can be read from and called, never constructed.
  call: 17,
  member: 18,
  primary: 19,
};

export const BINARY_LEVELS = new Map<ts.SyntaxKind, number>([
  [ts.SyntaxKind.CommaToken, LEVEL.comma],
  [ts.SyntaxKind.QuestionQuestionToken, LEVEL.nullish],
  [ts.SyntaxKind.BarBarToken, LEVEL.or],
  [ts.SyntaxKind.AmpersandAmpersandToken, LEVEL.and],
  [ts.SyntaxKind.BarToken, LEVEL.bitOr],
  [ts.SyntaxKind.CaretToken, LEVEL.bitXor],
  [ts.SyntaxKind.AmpersandToken, LEVEL.bitAnd],
  [ts.SyntaxKind.EqualsEqualsToken, LEVEL.equality],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, LEVEL.equality],
  [ts.SyntaxKind.ExclamationEqualsToken, LEVEL.equality],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, LEVEL.equality],
  [ts.SyntaxKind.LessThanToken, LEVEL.relational],
  [ts.SyntaxKind.LessThanEqualsToken, LEVEL.relational],
  [ts.SyntaxKind.GreaterThanToken, LEVEL.relational],
  [ts.SyntaxKind.GreaterThanEqualsToken, LEVEL.relational],
  [ts.SyntaxKind.InstanceOfKeyword, LEVEL.relational],
  [ts.SyntaxKind.InKeyword, LEVEL.relational],
  [ts.SyntaxKind.LessThanLessThanToken, LEVEL.shift],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, LEVEL.shift],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, LEVEL.shift],
  [ts.SyntaxKind.PlusToken, LEVEL.additive],
  [ts.SyntaxKind.MinusToken, LEVEL.additive],
  [ts.SyntaxKind.AsteriskToken, LEVEL.multiplicative],
  [ts.SyntaxKind.SlashToken, LEVEL.multiplicative],
  [ts.SyntaxKind.PercentToken, LEVEL.multiplicative],
  [ts.SyntaxKind.AsteriskAsteriskToken, LEVEL.exponent],
]);

export const UPDATES = new Set([ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken]);

// The operators that may skip their right side.
export const LOGICAL = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

/**
 * The expressions that may run code the author wrote, or write a binding: a call in any form, a read that may be a
 * getter, a spread that iterates or reads getters, a class with static code, and an update or a delete. A call, a
 * member read or an object spread runs nothing only on the proof effectUtils gives.
 */
export const EFFECT_KINDS = new Set([
  ts.SyntaxKind.CallExpression,
  ts.SyntaxKind.NewExpression,
  ts.SyntaxKind.TaggedTemplateExpression,
  ts.SyntaxKind.AwaitExpression,
  ts.SyntaxKind.YieldExpression,
  ts.SyntaxKind.DeleteExpression,
  ts.SyntaxKind.PostfixUnaryExpression,
  ts.SyntaxKind.PropertyAccessExpression,
  ts.SyntaxKind.ElementAccessExpression,
  ts.SyntaxKind.SpreadElement,
  ts.SyntaxKind.SpreadAssignment,
  ts.SyntaxKind.JsxSpreadAttribute,
  ts.SyntaxKind.ClassExpression,
]);

export const PURE_KEYWORDS = new Set([
  ts.SyntaxKind.TrueKeyword,
  ts.SyntaxKind.FalseKeyword,
  ts.SyntaxKind.NullKeyword,
]);

// The positions that take any expression but a comma without parentheses.
export const WHOLE_EXPRESSION = new Set([
  ts.SyntaxKind.ReturnStatement,
  ts.SyntaxKind.VariableDeclaration,
  ts.SyntaxKind.JsxExpression,
  ts.SyntaxKind.JsxSpreadAttribute,
  ts.SyntaxKind.PropertyAssignment,
  ts.SyntaxKind.ParenthesizedExpression,
  ts.SyntaxKind.SpreadAssignment,
  ts.SyntaxKind.SpreadElement,
  ts.SyntaxKind.ArrayLiteralExpression,
  ts.SyntaxKind.TemplateSpan,
  ts.SyntaxKind.YieldExpression,
]);

// The operators a unary expression follows: `typeof -a` needs no parentheses.
export const UNARY_OPERATORS = new Set([
  ts.SyntaxKind.TypeOfExpression,
  ts.SyntaxKind.VoidExpression,
  ts.SyntaxKind.DeleteExpression,
  ts.SyntaxKind.AwaitExpression,
]);

// The positions a value is read from, called or tagged in, which take a call but not an optional chain.
export const CALLED_FROM = new Set([
  ts.SyntaxKind.PropertyAccessExpression,
  ts.SyntaxKind.ElementAccessExpression,
  ts.SyntaxKind.CallExpression,
  ts.SyntaxKind.TaggedTemplateExpression,
  ts.SyntaxKind.NonNullExpression,
]);

// A name JSX can write as an attribute.
export const ATTRIBUTE_NAME = /^[A-Za-z_$][\w$-]*$/u;

// A string JSX can write between double quotes as it stands.
export const PLAIN_STRING = /^[^"\n{}<>&\\]*$/u;

// The mark `simple-import-sort` puts before a side-effect import's source and after a type import's.
export const SORT_MARK = '\u0000';

// The characters `simple-import-sort` swaps in its sort key, so `vite` sorts before `vite-plugin-solid`.
export const SORT_SWAPPED = './_-';

export const SORT_SWAPS = '_-./';

// The base layer's import groups for a project with no alias, in the convention `simple-import-sort` reads.
export const DEFAULT_IMPORT_GROUPS = [
  [
    '^node:',
    '^fs$',
    '^path$',
  ],
  [String.raw`^@?\w`],
  [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
  [String.raw`^\./`],
  [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
  [String.raw`^.+\.s?css$`],
];

// The comma a literal written over several lines ends its last member with.
export const TRAILING_COMMA = /,$/u;

// A line break as JSX reads one in text.
export const JSX_LINE_BREAK = /\r\n|\n|\r/u;

// The spaces JSX trims where a line of text meets the one before it.
export const JSX_LEADING_SPACES = /^[\t ]+/u;

// The mark some editors open a file with; the base keeps it, an option's text lands inside the base without it.
export const BYTE_ORDER_MARK = '\uFEFF';

// Every line break of a text the engine reads, each LF.
export const LINE_BREAKS = /\n/gu;

// The tokens whose text is their value, line breaks and indentation included.
export const STRING_TOKENS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
]);

// A line end the engine reads as LF: CRLF and a lone CR.
export const OTHER_LINE_ENDS = /\r\n?/gu;

// The characters that end a `//` comment: a note holding one would write the rest of it as code.
export const COMMENT_ENDS = /[\n\r\u2028\u2029]/u;

// The declarations that give a name only a type, and those that give it only a value; the rest give it both.
export const TYPE_ONLY_DECLARATIONS = new Set([
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.TypeParameter,
]);

export const VALUE_ONLY_DECLARATIONS = new Set([
  ts.SyntaxKind.VariableDeclaration,
  ts.SyntaxKind.Parameter,
  ts.SyntaxKind.BindingElement,
  ts.SyntaxKind.FunctionDeclaration,
]);
