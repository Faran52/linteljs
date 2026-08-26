/**
 * Runs the security-relevant slice of eslint-plugin-sonarjs over src and scripts. SonarQube proper needs a server
 * and a token, and this project has none; the same analyser SonarSource ships for JavaScript and TypeScript is
 * eslint-plugin-sonarjs, already a devDependency, so the checks run locally with no service.
 *
 * Deliberately NOT part of `eslint.config.ts`: that config turns some sonarjs rules off for documented reasons
 * and honours inline `eslint-disable` comments, and a security scan a comment can switch off is not a security
 * scan, so this one sets `noInlineConfig` and carries its own allowlist. The full ruleset is 279 rules, and
 * running all of them buries the security findings under hundreds of style complaints
 * (`arrow-function-convention` alone demands the opposite of the house style), so the list below is picked by
 * what a rule is FOR. Every name is checked against the installed plugin before the scan runs: a rule a plugin
 * upgrade renamed or dropped fails the run rather than skipping quietly.
 *
 * Usage: node scripts/auditSecurity.js
 */
import { relative, resolve } from 'node:path';

import { ESLint } from 'eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

const root = resolve(import.meta.dirname, '..');

/**
 * Rule name to the hazard it covers; the value is why the rule is in the scan, so a future reader can judge a
 * removal instead of guessing. Deliberately excluded: the 26 `aws-*` rules (no infrastructure code here), and
 * everything about complexity, naming, duplication or test hygiene, which are code quality and already covered
 * by `pnpm lint`.
 */
const SECURITY_RULES = {
  // Injection: attacker-controlled data reaching an interpreter.
  'code-eval': 'code injection through eval, Function and setTimeout with a string',
  'dynamically-constructed-templates': 'template injection in a server-side template engine',
  'os-command': 'OS command injection through exec with a built command line',
  'no-os-command-from-path': 'command resolved from PATH, so a planted binary wins',
  'sql-queries': 'SQL built by concatenation instead of parameters',
  'web-sql-database': 'Web SQL, deprecated and unsandboxed',
  'xml-parser-xxe': 'XML external entity expansion left enabled',
  'post-message': 'postMessage to or from an unchecked origin',
  'no-angular-bypass-sanitization': 'Angular sanitiser bypassed explicitly',
  'disabled-auto-escaping': 'template auto-escaping turned off',
  'dompurify-unsafe-config': 'DOMPurify configured to keep the dangerous elements',

  // Filesystem. sonarjs has no dedicated path-traversal rule; these are the file-facing
  // checks it does ship, and unsafe-unzip is the traversal case that matters (zip slip).
  'no-unsafe-unzip': 'zip slip and zip bomb: archive entries written without limits',
  'file-permissions': 'chmod or umask granting more than the owner needs',
  'publicly-writable-directories': 'temp paths any local user can write to',
  'hidden-files': 'server configured to serve dot-files',
  'file-uploads': 'upload handler without a size or destination limit',

  // Secrets.
  'no-hardcoded-secrets': 'a literal secret in source',
  'no-hardcoded-passwords': 'a literal password in source',
  'hardcoded-secret-signatures': 'literals matching a known provider key format',
  'review-blockchain-mnemonic': 'a wallet seed phrase in source',
  'no-hardcoded-ip': 'a pinned address that leaks topology and breaks on move',
  'confidential-information-logging': 'credentials or tokens written to a log',

  // Cryptography and randomness.
  'hashing': 'a broken or unsalted hash for passwords',
  'no-weak-cipher': 'DES, RC4 and the rest of the retired ciphers',
  'no-weak-keys': 'key sizes below the current floor',
  'encryption-secure-mode': 'ECB and other modes that leak plaintext structure',
  'weak-ssl': 'an obsolete TLS version pinned explicitly',
  'pseudo-random': 'Math.random where the value has to be unguessable',
  'insecure-jwt-token': 'JWT verified without checking the signature',

  // Transport and certificate verification.
  'unverified-certificate': 'certificate validation switched off',
  'unverified-hostname': 'hostname check switched off',
  'no-clear-text-protocols': 'http, ftp and telnet where the secure twin exists',
  'no-mixed-content': 'insecure subresource on a secure page',
  'disabled-resource-integrity': 'third-party script loaded without an integrity hash',
  'strict-transport-security': 'HSTS missing or too short',

  // Cookies and sessions.
  'insecure-cookie': 'cookie without the secure flag',
  'cookie-no-httponly': 'session cookie readable from JavaScript',
  'no-session-cookies-on-static-assets': 'session cookie leaked onto cacheable assets',
  'session-regeneration': 'session id kept across an authentication boundary',
  'csrf': 'CSRF protection disabled',

  // Response headers and browser-side hardening.
  'content-security-policy': 'CSP missing or set to allow everything',
  'frame-ancestors': 'clickjacking protection missing',
  'cors': 'CORS opened to any origin',
  'x-powered-by': 'stack version advertised in a response header',
  'no-mime-sniff': 'X-Content-Type-Options missing',
  'no-referrer-policy': 'referrer policy missing, so URLs leak cross-origin',
  'content-length': 'request body accepted without a size limit',
  'link-with-target-blank': 'target=_blank without noopener, giving the opener away',
  'no-intrusive-permissions': 'camera, geolocation and friends requested unprompted',
  'no-ip-forward': 'proxy forwarding the client address without validating it',
  'production-debug': 'debug mode left on in a production path',

  // ReDoS: a rule's regex runs over every file in someone else's repo, so catastrophic backtracking is a DoS there.
  'slow-regex': 'a pattern whose worst case is super-linear',
  'super-linear-regex': 'polynomial backtracking on crafted input',
  'regex-complexity': 'a pattern complex enough that nobody can reason about its cost',
  'stateful-regex': 'a shared /g regex carrying lastIndex between calls',
  'no-control-regex': 'a control character in a pattern, almost always a typo',
  'no-invalid-regexp': 'a pattern that throws at construction',
  'unicode-aware-regex': 'a pattern that mishandles astral characters',

  // Regex correctness, same family: a pattern that does not match what it looks like, so a rule misses a report.
  'anchor-precedence': 'an anchor binding to one alternative instead of the group',
  'duplicates-in-character-class': 'a character class repeating itself',
  'no-empty-character-class': 'a class that can never match',
  'no-empty-alternatives': 'an alternative that matches the empty string',
  'no-empty-group': 'a group that captures nothing',
  'no-empty-after-reluctant': 'a reluctant quantifier followed by something optional',
  'empty-string-repetition': 'a quantifier over something that can match empty',
  'no-misleading-character-class': 'a class split across a surrogate pair',
  'no-regex-spaces': 'runs of literal spaces nobody can count',
};

// Findings that are known, understood and accepted. Matched on file plus rule, not line, so an unrelated edit
// above does not silently retire the entry. Anything not listed here fails the run.
const ALLOWLIST = [
  {
    file: 'scripts/auditIgnores.js',
    rule: 'sonarjs/no-os-command-from-path',
    reason: 'maintainer tooling, never packed or shipped. Resolving pnpm from PATH is the point: '
      + 'the script runs where the developer runs pnpm.',
  },
];

const installed = Object.keys(sonarjs.rules);
const expected = Object.keys(SECURITY_RULES);
const missing = expected.filter((name) => {
  return !installed.includes(name);
});

// A rule this scan believes it runs but the plugin no longer has would show up as a clean report, the worst outcome.
if (missing.length > 0) {
  console.error(`eslint-plugin-sonarjs no longer ships ${missing.length} rule(s) this scan expects:`);

  for (const name of missing) {
    console.error(`  sonarjs/${name}  (${SECURITY_RULES[name]})`);
  }

  console.error('\nThe plugin renamed or dropped them. Update SECURITY_RULES, do not delete the line.');
  process.exit(1);
}

const rules = Object.fromEntries(expected.map((name) => {
  return [`sonarjs/${name}`, 'error'];
}));

const eslint = new ESLint({
  cwd: root,
  // `true` means: ignore eslint.config.ts entirely. This scan is not the repo's linting.
  overrideConfigFile: true,
  overrideConfig: [
    {
      // Type-aware, because several of these rules (sql-queries, hashing, the regex
      // family) resolve values through the type checker and degrade to nothing without it.
      files: ['src/**/*.ts'],
      plugins: { sonarjs },
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: root,
        },
      },
      linterOptions: {
        noInlineConfig: true,
        reportUnusedDisableDirectives: false,
      },
      rules,
    },
    {
      // scripts/ is plain Node ESM and CJS, outside tsconfig, so these rules get no types; syntax alone still runs.
      files: ['scripts/**/*.js', 'scripts/**/*.cjs'],
      plugins: { sonarjs },
      languageOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
      linterOptions: {
        noInlineConfig: true,
        reportUnusedDisableDirectives: false,
      },
      rules,
    },
  ],
});

console.log(`• sonarjs ${installed.length} rules installed, ${expected.length} selected as security relevant`);

const results = await eslint.lintFiles(['src', 'scripts']);

console.log(`• scanned ${results.length} files under src/ and scripts/`);

const findings = results.flatMap((result) => {
  return result.messages.map((message) => {
    return {
      file: relative(root, result.filePath),
      line: message.line,
      rule: message.ruleId,
      text: message.message,
      fatal: Boolean(message.fatal),
    };
  });
});

// A file that failed to parse produced no findings, which reads as clean. It is not.
const fatal = findings.filter((finding) => {
  return finding.fatal;
});

if (fatal.length > 0) {
  console.error('\nParse failures. These files were not scanned at all:');

  for (const finding of fatal) {
    console.error(`  ${finding.file}:${finding.line}  ${finding.text}`);
  }

  process.exit(1);
}

// `noInlineConfig` makes ESLint emit a rule-less warning for every disable comment it ignored: the setting
// working, not a finding, so it is dropped here. The suppressed rule still reports, the point of the flag.
const reported = findings.filter((finding) => {
  return finding.rule !== null;
});

const allowedOf = (finding) => {
  return ALLOWLIST.find((entry) => {
    return entry.file === finding.file && entry.rule === finding.rule;
  });
};

const allowed = reported.filter(allowedOf);
const failures = reported.filter((finding) => {
  return !allowedOf(finding);
});

const byRule = new Map();

for (const finding of reported) {
  byRule.set(finding.rule, (byRule.get(finding.rule) ?? 0) + 1);
}

if (byRule.size > 0) {
  console.log('\nfindings by rule:');

  for (const [rule, count] of [...byRule].sort()) {
    console.log(`  ${count}  ${rule}`);
  }
}

if (allowed.length > 0) {
  console.log('\nallowlisted, reported here so they stay visible:');

  for (const finding of allowed) {
    console.log(`  ${finding.file}:${finding.line}  ${finding.rule}`);
    console.log(`    ${finding.text}`);
    console.log(`    accepted: ${allowedOf(finding).reason}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} unaccepted finding(s):`);

  for (const finding of failures) {
    console.error(`  ${finding.file}:${finding.line}  ${finding.rule}`);
    console.error(`    ${finding.text}`);
  }

  console.error('\nFix it, or add an ALLOWLIST entry in this script saying why it is acceptable.');
  process.exit(1);
}

console.log(`\n✓ ${expected.length} security rules ran clean over ${results.length} files`);
