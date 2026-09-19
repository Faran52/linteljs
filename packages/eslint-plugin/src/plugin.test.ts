import {
  describe,
  expect,
  it,
} from 'vitest';

import linteljs, {
  configs,
  meta,
  PLUGIN_NAME,
} from './plugin.ts';
import { rules } from './rules/index.ts';
import { RULE_CATEGORIES } from './types.ts';

const PRESET_NAMES = ['recommended', ...RULE_CATEGORIES] as const;

describe('meta', () => {
  it('declares its published name and a semver version', () => {
    expect(meta.name).toBe('@linteljs/eslint-plugin');
    expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('carries that same meta object on the default export, not a copy', () => {
    expect(linteljs.meta).toBe(meta);
  });

  it('keeps the config prefix distinct from the published package name', () => {
    expect(PLUGIN_NAME).toBe('@linteljs');
    expect(meta.name).not.toBe(PLUGIN_NAME);
  });
});

describe('rules', () => {
  it('exposes the same rules object the registry exports, not a copy', () => {
    expect(linteljs.rules).toBe(rules);
  });

  // The registry's own keys are bare ids; a preset's `rules` record prefixes each with `@linteljs/`.
  it('registers every id unprefixed', () => {
    const ids = Object.keys(linteljs.rules ?? {});

    expect(ids).toEqual(Object.keys(rules));
    expect(ids.some((id) => {
      return id.startsWith(`${PLUGIN_NAME}/`);
    })).toBe(false);
  });
});

describe('recommended preset', () => {
  const recommendedIds = Object.entries(rules).filter(([, rule]) => {
    return rule.meta.docs.recommended;
  }).map(([id]) => {
    return `${PLUGIN_NAME}/${id}`;
  }).toSorted((left, right) => {
    return left.localeCompare(right);
  });

  it('has both a recommended and an opt-out rule to prove the split with', () => {
    expect(recommendedIds.length).toBeGreaterThan(0);
    expect(recommendedIds.length).toBeLessThan(Object.keys(rules).length);
  });

  it('enables exactly those ids in the legacy shape', () => {
    // TypeScript-only recommended rules live in the override, not the top-level `rules`.
    const enabled = [
      ...Object.keys(configs.recommended.rules),
      ...configs.recommended.overrides.flatMap((override) => {
        return Object.keys(override.rules);
      }),
    ].toSorted((left, right) => {
      return left.localeCompare(right);
    });

    expect(enabled).toEqual(recommendedIds);
  });

  it('enables exactly those ids across the flat blocks', () => {
    const enabled = configs['flat/recommended'].flatMap((block) => {
      return Object.keys(block.rules ?? {});
    }).toSorted((left, right) => {
      return left.localeCompare(right);
    });

    expect(enabled).toEqual(recommendedIds);
  });

  it('sets every recommended rule to error, in both shapes', () => {
    for (const severity of Object.values(configs.recommended.rules)) {
      expect(severity).toBe('error');
    }

    for (const override of configs.recommended.overrides) {
      for (const severity of Object.values(override.rules)) {
        expect(severity).toBe('error');
      }
    }

    for (const block of configs['flat/recommended']) {
      for (const severity of Object.values(block.rules ?? {})) {
        expect(severity).toBe('error');
      }
    }
  });
});

describe.each(PRESET_NAMES)('preset "%s"', (name) => {
  it('carries the plugin instance itself on the flat block, and nowhere else', () => {
    const [base, ...rest] = configs[`flat/${name}`];

    expect(base?.plugins?.[PLUGIN_NAME]).toBe(linteljs);

    for (const block of rest) {
      expect(block.plugins).toBeUndefined();
    }
  });

  it('carries the plugin name as a bare string in the legacy shape', () => {
    expect(configs[name].plugins).toEqual([PLUGIN_NAME]);
  });
});
