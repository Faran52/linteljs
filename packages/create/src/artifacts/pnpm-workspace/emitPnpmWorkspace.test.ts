import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type HostedFramework,
  type TargetId,
} from '../../model/answers/answers';

import { allowBuildsBlock, emitPnpmWorkspace } from './emitPnpmWorkspace';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('emitPnpmWorkspace', () => {
  it('allows the two builds every target needs, sorted', () => {
    expect(allowBuildsBlock(answersFor({ target: 'vue' }))).toBe(
      "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n",
    );
  });

  // `@vitejs/plugin-react-swc` pulls `@swc/core`, whose install script pnpm aborts the first install over.
  it('allows the swc binary the react build plugin pulls', () => {
    expect(allowBuildsBlock(answersFor({ target: 'react' }))).toBe(
      "allowBuilds:\n  '@swc/core': true\n  'sharp': true\n  'unrs-resolver': true\n",
    );
  });

  it('merges in the builds a target needs beyond the shared two, sorted with them', () => {
    const output = allowBuildsBlock(answersFor({ target: 'angular' }));

    expect(output).toBe(
      'allowBuilds:\n'
      + "  '@parcel/watcher': true\n"
      + "  'esbuild': true\n"
      + "  'lmdb': true\n"
      + "  'msgpackr-extract': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });
});

/**
 * Three plugins close their `eslint` peer range before the major this CLI installs. `jsx-a11y` and `solid` genuinely
 * run; `eslint-plugin-import` never does, arriving as an optional peer of the resolver every project installs.
 */
describe('peerDependencyRules', () => {
  it('allows the accessibility plugin the next layer names', () => {
    const output = emitPnpmWorkspace(answersFor({ target: 'next' }));

    expect(output).toContain('peerDependencyRules:\n  allowedVersions:\n');
    expect(output).toContain("    'eslint-plugin-jsx-a11y>eslint': '10'");
    // Gone with `eslint-config-next`: the layer registers neither plugin now, so neither is in the tree.
    expect(output).not.toContain('eslint-plugin-react>');
  });

  // The resolver is a dependency of the config every project installs, so this one is not target-specific.
  it('allows the inert resolver peer for every target', () => {
    expect(emitPnpmWorkspace(answersFor({ target: 'react' })))
      .toContain("    'eslint-plugin-import>eslint': '10'");
  });

  // Solid gets both: its own plugin, and the accessibility one `solid()` loads because Solid renders JSX.
  it('allows the solid plugin, and accessibility with it, for a solid project', () => {
    const output = emitPnpmWorkspace(answersFor({ target: 'solid' }));

    expect(output).toContain("    'eslint-plugin-solid>eslint': '10'");
    expect(output).toContain("    'eslint-plugin-jsx-a11y>eslint': '10'");
  });

  // Read off the dependencies the project installs, so an extension hosting solid is covered without naming it here.
  it('follows a hosted framework onto the target that hosts it', () => {
    const hosted = emitPnpmWorkspace(answersFor({
      target: 'webextension',
      hostedFramework: 'solid',
    }));
    const plain = emitPnpmWorkspace(answersFor({ target: 'webextension' }));

    expect(hosted).toContain("    'eslint-plugin-solid>eslint': '10'");
    expect(plain).not.toContain('eslint-plugin-solid>');
  });

  // Vue renders templates rather than JSX, so neither plugin is in its tree; its own accessibility plugin would be
  // `eslint-plugin-vuejs-accessibility`, which this standard does not ship yet.
  it('names no accessibility or solid allowance on a target that uses neither', () => {
    const output = emitPnpmWorkspace(answersFor({ target: 'vue' }));

    expect(output).not.toContain('eslint-plugin-jsx-a11y>');
    expect(output).not.toContain('eslint-plugin-solid>');
  });
});
