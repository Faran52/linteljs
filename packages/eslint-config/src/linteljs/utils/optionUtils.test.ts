import {
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';

import { checkOptions, editDistance } from './optionUtils';

import type { Island, LinteljsOptions } from '../../types';

interface WxtAngular {
  framework: 'wxt';
  islands: Island[];
}

interface AstroAngular {
  framework: 'astro';
  islands: Island[];
}

// Built from parsed JSON, the way a JavaScript config reaches `linteljs()` past the types.
const isOptions = (value: unknown): value is LinteljsOptions => {
  return typeof value === 'object' && value !== null;
};

const loose = (json: string): LinteljsOptions => {
  const parsed: unknown = JSON.parse(json);

  if (!isOptions(parsed)) {
    throw new Error(`not an object: ${json}`);
  }

  return parsed;
};

describe('editDistance', () => {
  it.each([
    [
      '',
      '',
      0,
    ],
    [
      'react',
      '',
      5,
    ],
    [
      '',
      'vue',
      3,
    ],
    [
      'framwork',
      'framework',
      1,
    ],
    [
      'kitten',
      'sitting',
      3,
    ],
    [
      'svelte',
      'svelte',
      0,
    ],
  ])('counts %j to %j as %i edits', (from, to, expected) => {
    const distance = editDistance(from, to);

    expect(distance).toBe(expected);
  });
});

describe('checkOptions', () => {
  it('passes every option it knows, at a value it takes', () => {
    const options: LinteljsOptions = {
      root: '/project',
      framework: 'astro',
      islands: ['react', 'vue'],
      typescript: true,
      html: false,
      testing: 'vitest',
      e2e: 'playwright',
      stories: 'storybook',
      router: 'tanstack-router',
      data: 'tanstack-query',
      styling: 'tailwind',
      tailwind: { entryPoint: './src/app.css' },
    };

    expect(() => {
      checkOptions(options);
    }).not.toThrow();
  });

  it('passes an enumerated option left undefined', () => {
    expect(() => {
      checkOptions({ framework: undefined });
    }).not.toThrow();
  });

  it('suggests the option a misspelt one is closest to', () => {
    expect(() => {
      checkOptions(loose('{"framwork":"react"}'));
    }).toThrow("@linteljs/eslint-config: unknown option 'framwork'. Did you mean 'framework'?");
  });

  it('lists the options when none is close', () => {
    expect(() => {
      checkOptions(loose('{"vitest":true}'));
    }).toThrow(/ option 'vitest'\. Expected one of: root, .*, tailwind\.$/u);
  });

  it('suggests the value a misspelt one is closest to', () => {
    expect(() => {
      checkOptions(loose('{"framework":"reakt"}'));
    }).toThrow("@linteljs/eslint-config: framework cannot be \"reakt\". Did you mean 'react'?");
  });

  it('refuses a value of the wrong type', () => {
    expect(() => {
      checkOptions(loose('{"testing":true}'));
    }).toThrow('@linteljs/eslint-config: testing cannot be true. Expected one of: vitest, jest.');
  });

  it('checks each island on its own', () => {
    expect(() => {
      checkOptions(loose('{"framework":"astro","islands":["react","preact"]}'));
    }).toThrow("@linteljs/eslint-config: islands cannot be \"preact\". Did you mean 'react'?");
  });

  it.each<[LinteljsOptions, string]>([
    [{ islands: ['react'] }, 'undefined'],
    [{ framework: 'next', islands: ['react'] }, '"next"'],
  ])('refuses islands outside astro and wxt: %j', (options, framework) => {
    expect(() => {
      checkOptions(options);
    }).toThrow(`@linteljs/eslint-config: islands needs framework 'astro' or 'wxt', not ${framework}.`);
  });

  it('gives wxt one island and astro several', () => {
    expect(() => {
      checkOptions({ framework: 'wxt', islands: ['react', 'vue'] });
    }).toThrow("@linteljs/eslint-config: framework 'wxt' hosts one island, not 2.");

    expect(() => {
      checkOptions({ framework: 'wxt', islands: ['react'] });
    }).not.toThrow();
  });

  it('refuses an angular island under wxt alone', () => {
    expect(() => {
      checkOptions(loose('{"framework":"wxt","islands":["angular"]}'));
    }).toThrow('@linteljs/eslint-config: wxt islands cannot be "angular". Expected one of: react, vue, solid, svelte.');

    expect(() => {
      checkOptions({ framework: 'astro', islands: ['angular'] });
    }).not.toThrow();
  });

  it('types an angular island under wxt alone as an error', () => {
    expectTypeOf<WxtAngular>().not.toExtend<LinteljsOptions>();
    expectTypeOf<AstroAngular>().toExtend<LinteljsOptions>();
  });

  it('refuses tailwind options without tailwind styling', () => {
    expect(() => {
      checkOptions({ styling: 'stylex', tailwind: { entryPoint: './src/app.css' } });
    }).toThrow("@linteljs/eslint-config: tailwind needs styling 'tailwind'.");
  });
});
