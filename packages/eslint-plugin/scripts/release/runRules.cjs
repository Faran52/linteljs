/**
 * Loads the built plugin and lints one fixture, on whatever Node and ESLint are present. CommonJS and ES5 syntax
 * on purpose: this is the file the `oldest-runtime` job runs inside `node:12-alpine`, and it has to parse before
 * it can prove anything. `compatMatrix.js` covers the other axis, every ESLint major on a modern Node; only a
 * container can answer whether the shipped bundle runs on the Node floor `engines` declares, because a bundler
 * lowers syntax and leaves built-in methods exactly where they were.
 *
 * Usage: node scripts/runRules.cjs [path-to-entry]
 */
'use strict';

var Linter = require('eslint').Linter;
var join = require('path').join;
var resolve = require('path').resolve;

// Resolved against the working directory, not this file: the container copies `dist` and `scripts` into a new home.
var entry = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : join(__dirname, '..', 'dist', 'index.js');
var plugin = require(entry);

var EXPECTED = ['import-newlines', 'prefer-arrow-functions', 'export-specifier-newline'];

var FIXTURE = [
  "import { alpha, bravo, charlie } from 'mod';",
  '',
  'function greet(name) { return alpha + bravo + charlie + name; }',
  '',
  'export { alpha, bravo };',
  '',
].join('\n');

var linter = new Linter();
var rules = {};

EXPECTED.forEach((name) => {
  if (!plugin.rules[name]) {
    throw new Error('the built plugin does not register ' + name);
  }

  linter.defineRule('@linteljs/' + name, plugin.rules[name]);
  rules['@linteljs/' + name] = 'error';
});

var messages = linter.verify(FIXTURE, {
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: rules,
});

var reported = messages.map((message) => {
  return message.ruleId;
});

var missing = EXPECTED.filter((name) => {
  return reported.indexOf('@linteljs/' + name) === -1;
});

var fatal = messages.filter((message) => {
  return message.fatal;
});

if (fatal.length > 0) {
  throw new Error('fatal: ' + JSON.stringify(fatal));
}

if (missing.length > 0) {
  throw new Error('no report from ' + missing.join(', '));
}

console.log('  ✓ node ' + process.versions.node + ': all ' + EXPECTED.length + ' rules reported');
