import { hostedAnswersFor } from '@mocks/answersFor';

import { ANSWERS } from '@answers';

import {
  answerRows,
  gateRows,
  literal,
  nameDeclaration,
  stackRows,
} from './recordUtils';

const VERSIONS = {
  '@linteljs/eslint-config': '^2.0.0',
  'react': '^19.3.0',
  'typescript': '~5.9.3',
};

describe('stackRows', () => {
  it('states the version as recorded, without the range it was written with, in the order a reader wants', () => {
    const actual = stackRows(hostedAnswersFor({ packageManagerVersion: '12.4.1' }), VERSIONS);
    const expected = [
      ["name: 'linteljs'", "version: '2.0.0'"],
      ["name: 'react'", "version: '19.3.0'"],
      ["name: 'typescript'", "version: '5.9.3'"],
      ["name: 'node'", "version: '26.9.0'"],
      ["name: 'pnpm'", "version: '12.4.1'"],
    ];
    expect(actual).toEqual(expected);
  });

  it('prints no framework row for a target that renders with none', () => {
    const actual = stackRows(hostedAnswersFor({ target: 'webextension' }), VERSIONS);
    const expected = [
      ["name: 'linteljs'", "version: '2.0.0'"],
      ["name: 'typescript'", "version: '5.9.3'"],
      ["name: 'node'", "version: '26.9.0'"],
    ];
    expect(actual).toEqual(expected);
  });

  it('strips only a leading range sigil from a recorded version', () => {
    const actual = stackRows(hostedAnswersFor({ target: 'webextension' }), {
      '@linteljs/eslint-config': 'workspace:^',
      'typescript': '5.9.3',
    });
    const expected = ["name: 'linteljs'", "version: 'workspace:^'"];
    expect(actual).toContainEqual(expected);
  });

  it('reads no framework version for a target that renders with none', () => {
    const actual = stackRows(hostedAnswersFor({ target: 'webextension' }), { undefined: '1.0.0' });
    const expected = [["name: 'node'", "version: '26.9.0'"]];

    expect(actual)
      .toEqual(expected);
  });

  it('leaves out a row whose version is unknown', () => {
    const actual = stackRows(hostedAnswersFor(), {});
    const expected = [["name: 'node'", "version: '26.9.0'"]];
    expect(actual).toEqual(expected);
  });
});

describe('gateRows', () => {
  it('prints what each leg of check runs for the target, not what another target runs', () => {
    const rows = gateRows(hostedAnswersFor({
      target: 'react-native',
      testing: 'none',
    }));

    const expected = [
      ["command: 'pnpm lint'", "runs: 'eslint . --concurrency auto'"],
      ["command: 'pnpm lint:types'", "runs: 'node scripts/checkBannedPatterns.ts src'"],
      ["command: 'pnpm lint:css'", "runs: 'stylelint \"src/**/*.css\" --allow-empty-input'"],
      ["command: 'pnpm typecheck'", "runs: 'tsc --noEmit'"],
      ["command: 'pnpm build'", "runs: 'expo export'"],
    ];
    expect(rows).toEqual(expected);
  });

  it('breaks a command too long for one line into joined literals, each inside the line length', () => {
    const rows = gateRows(hostedAnswersFor({
      target: 'svelte',
      languages: ['ja'],
    }));
    const typecheck = rows
      .find(([command]) => {
        return command === "command: 'pnpm typecheck'";
      })?.[1] ?? '';
    const lines = typecheck.split('\n');
    const joined = lines
      .map((line) => {
        return line.replace(/^\s*(?:runs: |\+ )'(.*)'$/u, '$1');
      })
      .join('');
    // Four columns of row indent sit in front of `runs:`.
    const fits = lines
      .every((line) => {
        return line.length + 4 <= 120;
      });

    expect(lines.length).toBeGreaterThan(1);
    expect(fits).toBe(true);
    expect(joined).toMatch(/^paraglide-js compile .* && svelte-kit sync && svelte-check /u);
  });
});

describe('literal', () => {
  it('keeps a command of 100 columns on one line, and breaks one of 101', () => {
    const full = `${'a'.repeat(49)} ${'b'.repeat(50)}`;
    const over = `${'a'.repeat(50)} ${'b'.repeat(50)}`;
    const kept = literal(full);
    const broken = literal(over);

    expect(kept).toBe(`'${full}'`);
    expect(broken).toBe(`'${'a'.repeat(50)} '\n      + '${'b'.repeat(50)}'`);
  });
});

describe('nameDeclaration', () => {
  it('keeps a name that fills 120 columns on one line, and wraps one past them', () => {
    const full = 'a'.repeat(97);
    const over = 'a'.repeat(98);
    const kept = nameDeclaration(full);
    const wrapped = nameDeclaration(over);

    expect(kept).toBe(`export const NAME = '${full}';`);
    expect(kept).toHaveLength(120);
    expect(wrapped).toBe(`export const NAME\n  = '${over}';`);
  });

  it('breaks the longest name npm takes into joined literals, each inside 120 columns', () => {
    const name = `@${'s'.repeat(100)}/${'n'.repeat(112)}`;
    const lines = nameDeclaration(name).split('\n');
    const joined = lines
      .slice(1)
      .map((line) => {
        return line.replace(/^\s*[=+] '(.*)';?$/u, '$1');
      })
      .join('');
    const fits = lines
      .every((line) => {
        return line.length <= 120;
      });

    expect(lines).toHaveLength(3);
    expect(fits).toBe(true);
    expect(joined).toBe(name);
  });
});

describe('answerRows', () => {
  it('prints the answers a prompt asked, and nothing else', () => {
    const actual = answerRows(hostedAnswersFor({ store: 'zustand' }), ANSWERS);
    const expected = [
      ["label: 'Framework'", "value: 'react'"],
      ["label: 'Testing'", "value: 'vitest'"],
      ["label: 'Libraries'", "value: 'es-toolkit'"],
      ["label: 'State store'", "value: 'zustand'"],
      ["label: 'Type safety'", "value: 'strict'"],
      ["label: 'AI agents'", "value: 'claude-code'"],
      ["label: 'AI plugins'", "value: 'ponytail, context7, frontend-design'"],
    ];
    expect(actual).toEqual(expected);
  });

  it.each([
    ['react-native', false],
    ['react', false],
    ['webextension', true],
  ] as const)('prints the browser for %s only where it is asked: %s', (target, expected) => {
    const rows = answerRows(hostedAnswersFor({ target }), ANSWERS);
    const hasBrowser = rows
      .some(([label]) => {
        return label === "label: 'Browser'";
      });
    expect(hasBrowser).toBe(expected);
  });

  it('prints a list answer joined, and no row for an empty one', () => {
    const label = `label: '${ANSWERS.agents.prompt}'`;

    const actual = answerRows(hostedAnswersFor({ agents: ['codex', 'cursor'] }), ANSWERS);
    const expected = [
      label,
      "value: 'codex, cursor'",
    ];
    expect(actual).toContainEqual(expected);

    const rows = answerRows(hostedAnswersFor({ agents: [] }), ANSWERS);
    const labels = rows
      .map(([row]) => {
        return row;
      });

    expect(labels).not.toContain(label);
  });

  it('prints nothing for an answer no prompt asks', () => {
    const rows = answerRows(hostedAnswersFor({ aliases: { '@app/*': './src/*' } }), ANSWERS);

    const noneScoped = rows
      .every(([label]) => {
        return !label.includes('@app');
      });

    expect(noneScoped).toBe(true);
  });
});
