// Not in `eslint.config.ts`: a scan an inline comment can switch off is not a scan.
import { relative, resolve } from 'node:path';
import process from 'node:process';

import { countBy } from 'es-toolkit';
import { ESLint } from 'eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

import { log, logError } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';

interface Finding {
  file: string;
  rule: string | null;
  fatal: boolean;
  line: number;
  text: string;
}

const root = resolve(import.meta.dirname, '../../..');

// Out on purpose: `aws-*`, with no infrastructure here, and what `pnpm lint` already covers.
const SECURITY_RULES: Record<string, string> = {
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

  'no-unsafe-unzip': 'zip slip and zip bomb: archive entries written without limits',
  'file-permissions': 'chmod or umask granting more than the owner needs',
  'publicly-writable-directories': 'temp paths any local user can write to',
  'hidden-files': 'server configured to serve dot-files',
  'file-uploads': 'upload handler without a size or destination limit',

  'no-hardcoded-secrets': 'a literal secret in source',
  'no-hardcoded-passwords': 'a literal password in source',
  'hardcoded-secret-signatures': 'literals matching a known provider key format',
  'review-blockchain-mnemonic': 'a wallet seed phrase in source',
  'no-hardcoded-ip': 'a pinned address that leaks topology and breaks on move',
  'confidential-information-logging': 'credentials or tokens written to a log',

  'hashing': 'a broken or unsalted hash for passwords',
  'no-weak-cipher': 'DES, RC4 and the rest of the retired ciphers',
  'no-weak-keys': 'key sizes below the current floor',
  'encryption-secure-mode': 'ECB and other modes that leak plaintext structure',
  'weak-ssl': 'an obsolete TLS version pinned explicitly',
  'pseudo-random': 'Math.random where the value has to be unguessable',
  'insecure-jwt-token': 'JWT verified without checking the signature',

  'unverified-certificate': 'certificate validation switched off',
  'unverified-hostname': 'hostname check switched off',
  'no-clear-text-protocols': 'http, ftp and telnet where the secure twin exists',
  'no-mixed-content': 'insecure subresource on a secure page',
  'disabled-resource-integrity': 'third-party script loaded without an integrity hash',
  'strict-transport-security': 'HSTS missing or too short',

  'insecure-cookie': 'cookie without the secure flag',
  'cookie-no-httponly': 'session cookie readable from JavaScript',
  'no-session-cookies-on-static-assets': 'session cookie leaked onto cacheable assets',
  'session-regeneration': 'session id kept across an authentication boundary',
  'csrf': 'CSRF protection disabled',

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

  // A rule's regex runs over someone else's repo, so catastrophic backtracking is a DoS there.
  'slow-regex': 'a pattern whose worst case is super-linear',
  'super-linear-regex': 'polynomial backtracking on crafted input',
  'regex-complexity': 'a pattern complex enough that nobody can reason about its cost',
  'stateful-regex': 'a shared /g regex carrying lastIndex between calls',
  'no-control-regex': 'a control character in a pattern, almost always a typo',
  'no-invalid-regexp': 'a pattern that throws at construction',
  'unicode-aware-regex': 'a pattern that mishandles astral characters',

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

// `rules` is optional on a plugin, so a missing one would read as a mass rename.
if (!sonarjs.rules) {
  throw new Error('eslint-plugin-sonarjs exports no rules: nothing for this scan to run');
}

const installed = Object.keys(sonarjs.rules);
const expected = Object.keys(SECURITY_RULES);
const missing = expected
  .filter((name) => {
    return !installed.includes(name);
  });

// A rule the plugin no longer has would show up as a clean report.
if (missing.length > 0) {
  logError(`eslint-plugin-sonarjs no longer ships ${String(missing.length)} rule(s) this scan expects:\n${
    missing
      .map((name) => {
        return `  sonarjs/${name}  (${String(SECURITY_RULES[name])})`;
      })
      .join('\n')}\nThe plugin renamed or dropped them. Update SECURITY_RULES, do not delete the line.`);

  process.exit(1);
}

const rules = Object.fromEntries(expected
  .map((name) => {
    const setting: [string, 'error'] = [`sonarjs/${name}`, 'error'];

    return setting;
  }));

const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    {
      // Type-aware: several of these rules degrade to nothing without the type checker.
      files: ['src/**/*.ts', 'scripts/**/*.ts'],
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
  ],
});

log(`sonarjs ${String(installed.length)} rules installed, ${String(expected.length)} selected as security relevant`);

const results = await eslint.lintFiles(['src', 'scripts']);

log(`scanned ${String(results.length)} files under src/ and scripts/`);

const findings = results
  .flatMap((result) => {
    return result.messages
      .map((message) => {
        const finding: Finding = {
          file: relative(root, result.filePath),
          line: message.line,
          rule: message.ruleId,
          text: message.message,
          fatal: Boolean(message.fatal),
        };

        return finding;
      });
  });

// A file that failed to parse produced no findings, which reads as clean.
const fatal = findings
  .filter((finding) => {
    return finding.fatal;
  });

if (fatal.length > 0) {
  logError(`Parse failures. These files were not scanned at all:\n${fatal
    .map((finding) => {
      return `  ${finding.file}:${String(finding.line)}  ${finding.text}`;
    })
    .join('\n')}`);

  process.exit(1);
}

// `noInlineConfig` warns for every disable comment it ignored: the setting working, not a finding.
const reported = findings
  .filter((finding) => {
    return finding.rule !== null;
  });

const byRule = countBy(reported, (finding) => {
  return String(finding.rule);
});

const lineOf = ({
  file,
  line,
  rule,
  text,
}: Finding): string => {
  return `  ${file}:${String(line)}  ${String(rule)}\n    ${text}`;
};

if (reported.length > 0) {
  log(`findings by rule:\n${Object.entries(byRule)
    .sort(([left], [right]) => {
      return left.localeCompare(right);
    })
    .map(([rule, count]) => {
      return `  ${String(count)}  ${rule}`;
    })
    .join('\n')}`);
}

if (reported.length > 0) {
  logError(`${String(reported.length)} finding(s):\n${reported
    .map(lineOf)
    .join('\n')}`);

  process.exit(1);
}

log(`${String(expected.length)} security rules ran clean over ${String(results.length)} files`);
