import type { AliasMap } from '../../answers/answers';
import type { ScaffoldSpec } from '../record';

// `--no-interactive` forces the piped behaviour; `--eslint` is React-only, since the default writes `.oxlintrc.json`.
export const viteScaffold = (template: string, eslint = false) => {
  return (name: string): ScaffoldSpec => {
    return {
      kind: 'create',
      args: [
        'vite',
        name,
        '--template',
        `${template}-ts`,
        ...(eslint ? ['--eslint'] : []),
        '--no-interactive',
        '--no-immediate',
      ],
    };
  };
};

// SvelteKit indents with tabs; `no-tabs` has no fixer.
export const tabsToSpaces = (source: string): string => {
  return source.replaceAll(/^[ \t]+/gm, (indent) => {
    return indent.replaceAll('\t', '  ');
  });
};

export const HOOKS_ALIAS: AliasMap = { '@hooks/*': './src/lib/hooks/*' };

// `jsx-a11y-x` is here because `react()` loads it, so every target composing that layer installs it.
export const COMMON_REACT_PLUGINS = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-jsx-a11y-x',
  'eslint-plugin-react-hooks',
];

const ASSET_REQUIRE = /require\('([^']+\.(?:png|jpe?g|gif|webp|avif|svg))'\)/g;

// A legal identifier off the filename: `-` marks a hump, other illegal characters drop, a leading digit takes a prefix.
const bindingFor = (path: string): string => {
  const base = path.slice(path.lastIndexOf('/') + 1).replace(/\.\w+$/, '');
  const camel = base.replaceAll(/-(\w)/g, (_match, letter: string) => {
    return letter.toUpperCase();
  });
  const name = `${camel.replaceAll(/\W/g, '')}Asset`;

  return /^\d/.test(name) ? `asset${name}` : name;
};

// `require` returns `any`, so every asset tripped `no-unsafe-assignment`; an import typechecks against
// `src/typings/assets.d.ts`. Left unsorted since the fix pass reorders imports.
export const esmAssetImports = (source: string): string => {
  const bindings = new Map<string, string>();
  // Two assets sharing a filename in different directories would collide on one `const`.
  const claimed = new Map<string, number>();

  const rewritten = source.replaceAll(ASSET_REQUIRE, (_match, path: string) => {
    const existing = bindings.get(path);

    if (existing !== undefined) {
      return existing;
    }

    const base = bindingFor(path);
    const taken = claimed.get(base) ?? 0;
    const name = taken === 0 ? base : `${base}${String(taken + 1)}`;

    claimed.set(base, taken + 1);
    bindings.set(path, name);

    return name;
  });

  if (bindings.size === 0) {
    return source;
  }

  const imports = [...bindings].map(([path, name]) => {
    return `import ${name} from '${path}';`;
  });

  return `${imports.join('\n')}\n${rewritten}`;
};
