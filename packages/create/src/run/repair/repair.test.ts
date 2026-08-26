import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '../../model/answers/answers';
import { exists } from '../utils/fsUtils';

import { repairScaffoldedOutput } from './repair';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-rewrite-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

// The repairs are read off a record, and a record is built from answers, so a test naming only a target
// still hands over a whole set.
const answersFor = (target: TargetId): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target,
  };
};

// The generator's own output, planted at the paths a generator would have written it to.
const scaffold = async (files: Record<string, string>): Promise<void> => {
  for (const [path, body] of Object.entries(files)) {
    await mkdir(join(cwd, path, '..'), { recursive: true });
    await writeFile(join(cwd, path), body, 'utf8');
  }
};
describe('starter fixes', () => {
  // Each case plants the generator's kebab-case name and reads back the PascalCase one: `repairScaffoldedOutput` fixes
  // text at the original path before `starterRenames` moves it, so reading the original back asserts the wrong order.

  // `require` is typed `any`, so every asset request in Expo's template tripped `no-unsafe-assignment` wherever it
  // landed.
  it('turns the react native asset requires into imports, one per distinct asset', async () => {
    await scaffold({
      'src/components/app-tabs.tsx': [
        "import { NativeTabs } from 'expo-router/unstable-native-tabs';",
        '',
        'export const AppTabs = () => {',
        "  const home = require('@/assets/images/tabIcons/home.png');",
        "  const again = require('@/assets/images/tabIcons/home.png');",
        "  const explore = require('@/assets/images/tabIcons/explore.png');",
        '',
        '  return [home, again, explore];',
        '};',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    const output = await readFile(join(cwd, 'src/components/AppTabs.tsx'), 'utf8');

    expect(output).toContain("import homeAsset from '@/assets/images/tabIcons/home.png';");
    expect(output).toContain("import exploreAsset from '@/assets/images/tabIcons/explore.png';");
    expect(output).not.toContain('require(');
    // The repeat binds once and is used twice, rather than importing the same file under two names.
    expect(output.match(/import homeAsset/g)).toHaveLength(1);
    expect(output).toContain('const again = homeAsset;');
  });

  it('leaves a react native file with no assets in it untouched', async () => {
    const source = "export const nothing = require('node:path');\n";

    await scaffold({ 'src/components/web-badge.tsx': source });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await readFile(join(cwd, 'src/components/WebBadge.tsx'), 'utf8')).toBe(source);
  });

  it("voids expo's floating splash screen call", async () => {
    await scaffold({ 'src/app/_layout.tsx': 'SplashScreen.preventAutoHideAsync();\n' });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await readFile(join(cwd, 'src/app/_layout.tsx'), 'utf8'))
      .toBe('void SplashScreen.preventAutoHideAsync();\n');
  });

  it('refuses to apply a starter fix through a symbolic link', async () => {
    const external = join(cwd, 'external-layout.tsx');

    await mkdir(join(cwd, 'src/app'), { recursive: true });
    await writeFile(external, 'SplashScreen.preventAutoHideAsync();\n', 'utf8');
    await symlink(external, join(cwd, 'src/app/_layout.tsx'));

    await expect(repairScaffoldedOutput(cwd, answersFor('react-native')))
      .rejects.toThrow('Refusing to write src/app/_layout.tsx: target is a symbolic link');
    await expect(readFile(external, 'utf8'))
      .resolves.toBe('SplashScreen.preventAutoHideAsync();\n');
  });

  // `onPress` wants void back, so an `async` handler returned a promise nothing awaited.
  it('drops the async from the external link handler and voids the browser call', async () => {
    await scaffold({
      'src/components/external-link.tsx': [
        '      onPress={async (event) => {',
        '        if (process.env.EXPO_OS !== \'web\') {',
        '          await openBrowserAsync(href, {',
        '            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,',
        '          });',
        '        }',
        '      }}',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    const output = await readFile(join(cwd, 'src/components/ExternalLink.tsx'), 'utf8');

    expect(output).toContain('onPress={(event) => {');
    expect(output).toContain('void openBrowserAsync(href, {');
    expect(output).not.toContain('await openBrowserAsync');
  });

  it('removes the two themed-view props nothing reads', async () => {
    await scaffold({
      'src/components/themed-view.tsx': [
        'export type ThemedViewProps = ViewProps & {',
        '  lightColor?: string;',
        '  darkColor?: string;',
        '  type?: ThemeColor;',
        '};',
        '',
        'export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {',
        '  return null;',
        '}',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    const output = await readFile(join(cwd, 'src/components/ThemedView.tsx'), 'utf8');

    expect(output).not.toContain('lightColor');
    expect(output).not.toContain('darkColor');
    expect(output).toContain('export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {');
  });

  it('replaces the hydration effect with a store read', async () => {
    await scaffold({
      'src/hooks/use-color-scheme.web.ts': [
        "import { useEffect, useState } from 'react';",
        '',
        'export function useColorScheme() {',
        '  const [hasHydrated, setHasHydrated] = useState(false);',
        '',
        '  useEffect(() => {',
        '    setHasHydrated(true);',
        '  }, []);',
        '',
        '  return hasHydrated;',
        '}',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    const output = await readFile(join(cwd, 'src/hooks/useColorScheme.web.ts'), 'utf8');

    expect(output).toContain("import { useSyncExternalStore } from 'react';");
    expect(output).toContain('const hasHydrated = useSyncExternalStore(');
    expect(output).not.toContain('useEffect');
    expect(output).not.toContain('setHasHydrated');
  });

  it('rewrites the animated icon assets and unwinds its promise chain', async () => {
    await scaffold({
      'src/components/animated-icon.tsx': [
        '      onLayout={() => {',
        '        SplashScreen.hideAsync().finally(() => {',
        '          setAnimate(true);',
        '        });',
        '      }}',
        "      source={require('@/assets/images/expo-logo.png')}",
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    const output = await readFile(join(cwd, 'src/components/AnimatedIcon.tsx'), 'utf8');

    expect(output).toContain("import expoLogoAsset from '@/assets/images/expo-logo.png';");
    expect(output).toContain('await SplashScreen.hideAsync();');
    expect(output).toContain('void reveal();');
    expect(output).not.toContain('.finally(');
  });

  it("fills vue's empty html lang, which is worse than none", async () => {
    await scaffold({ 'index.html': '<html lang="">\n' });

    await repairScaffoldedOutput(cwd, answersFor('vue'));

    expect(await readFile(join(cwd, 'index.html'), 'utf8')).toBe('<html lang="en">\n');
  });

  // A template `src` is not an import to ESLint or to `vue-tsc`, so this line clears every other
  // gate and fails the build: the emitted tsconfig and vite config carry no `@/`.
  it('relativises the @/ alias create-vue points its logo at', async () => {
    await scaffold({ 'src/App.vue': '<template><img src="@/assets/logo.svg" /></template>\n' });

    await repairScaffoldedOutput(cwd, answersFor('vue'));

    expect(await readFile(join(cwd, 'src/App.vue'), 'utf8'))
      .toBe('<template><img src="./assets/logo.svg" /></template>\n');
  });

  it("gives svelte's document a title and drops the non-baseline meta", async () => {
    await scaffold({
      'src/app.html': [
        '<html lang="en">',
        '\t<head>',
        '\t\t<meta name="text-scale" content="scale" />',
        '\t\t%sveltekit.head%',
        '\t</head>',
        '</html>',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('svelte'));

    const output = await readFile(join(cwd, 'src/app.html'), 'utf8');

    expect(output).toContain('<title>App</title>');
    expect(output).not.toContain('text-scale');
  });

  it("types svelte's props and converts its tabs, which no fixer can do", async () => {
    await scaffold({
      'src/routes/+layout.svelte': [
        '<script lang="ts">',
        '\tlet { children } = $props();',
        '</script>',
        '',
        '{@render children()}',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('svelte'));

    const output = await readFile(join(cwd, 'src/routes/+layout.svelte'), 'utf8');

    expect(output).not.toContain('\t');
    expect(output).toContain("import type { Snippet } from 'svelte';");
    expect(output).toContain('let { children }: { children: Snippet } = $props();');
  });

  it("types angular's catch callback and stops plain TS coercing a number", async () => {
    await scaffold({ 'src/main.ts': 'bootstrapApplication(App).catch((err) => log(err));\n' });
    await repairScaffoldedOutput(cwd, answersFor('angular'));

    expect(await readFile(join(cwd, 'src/main.ts'), 'utf8')).toContain('(err: unknown) =>');

    await scaffold({ 'src/counter.ts': 'el.innerHTML = `Count is ${counter}`;\n' });
    await repairScaffoldedOutput(cwd, answersFor('webextension'));

    expect(await readFile(join(cwd, 'src/counter.ts'), 'utf8')).toContain('${String(counter)}');
  });

  it('reports each file it repaired, so the CLI can list it beside the ones it wrote', async () => {
    const written: string[] = [];

    await scaffold({
      'index.html': '<html lang="">\n',
      'src/App.vue': '<template />\n',
    });
    await repairScaffoldedOutput(cwd, answersFor('vue'), (path) => {
      written.push(path);
    });

    // Only the file the fix changed: `App.vue` has no `@/` in it and is left alone.
    expect(written).toEqual(['index.html']);
  });

  it('survives a generator that moved its starter files', async () => {
    await expect(repairScaffoldedOutput(cwd, answersFor('svelte')))
      .resolves.toBeUndefined();
  });

  it('surfaces a starter read failure instead of treating it as a moved file', async () => {
    await mkdir(join(cwd, 'index.html'));

    await expect(repairScaffoldedOutput(cwd, answersFor('vue'))).rejects.toThrow(/EISDIR/);
  });

  // `no-empty-source` and `no-duplicate-selectors` have no fixer, so these two are the whole
  // difference between a `lint:css` gate that passes on day one and one that does not.
  it("fills angular's empty component stylesheet, which no fixer reaches", async () => {
    await scaffold({ 'src/app/app.css': '' });
    await repairScaffoldedOutput(cwd, answersFor('angular'));

    expect(await readFile(join(cwd, 'src/app/app.css'), 'utf8'))
      .toBe('/* Component styles for app-root. */\n');
  });

  it('leaves a component stylesheet that already has a rule in it', async () => {
    const styled = ':host {\n  display: block;\n}\n';

    await scaffold({ 'src/app/app.css': styled });
    await repairScaffoldedOutput(cwd, answersFor('angular'));

    expect(await readFile(join(cwd, 'src/app/app.css'), 'utf8')).toBe(styled);
  });

  it('merges the two :root blocks create-vue writes into one file', async () => {
    await scaffold({
      'src/assets/base.css': [
        ':root {',
        '  --vt-c-white: #fff;',
        '}',
        '',
        '/* semantic color variables for this project */',
        ':root {',
        '  --color-text: var(--vt-c-white);',
        '}',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('vue'));

    const merged = await readFile(join(cwd, 'src/assets/base.css'), 'utf8');

    expect(merged.match(/:root \{/g)).toHaveLength(1);
    expect(merged).toContain('--color-text: var(--vt-c-white);');
  });

  // The repo-structure rule shipped beside it says a Pinia store lives in `lib/store/`, and
  // nothing in `create-vue`'s output imports the demo one, so the move is the whole repair.
  it("moves create-vue's demo store to where the layout rule puts it", async () => {
    const written: string[] = [];
    const store = 'export const useCounterStore = defineStore("counter", () => ({}));\n';

    await scaffold({ 'src/stores/counter.ts': store });
    await repairScaffoldedOutput(cwd, answersFor('vue'), (path) => {
      written.push(path);
    });

    expect(await readFile(join(cwd, 'src/lib/store/counter.ts'), 'utf8')).toBe(store);
    expect(await exists(join(cwd, 'src/stores/counter.ts'))).toBe(false);
    expect(written).toContain('src/lib/store/counter.ts');
  });
});

// The tsconfig halves `create-vite`/`create-vue` reach through `references`, but the emitted root tsconfig is
// standalone, so they configure nothing while still reading as authoritative.
describe('stale scaffolder files', () => {
  const noticesFor = async (
    target: TargetId,
    files: Record<string, string>,
  ): Promise<string[]> => {
    const notices: string[] = [];

    for (const [path, body] of Object.entries(files)) {
      await writeFile(join(cwd, path), body, 'utf8');
    }

    await repairScaffoldedOutput(cwd, answersFor(target), undefined, (message) => {
      notices.push(message);
    });

    return notices;
  };

  it('removes the orphaned tsconfig halves and says which', async () => {
    const notices = await noticesFor('react', {
      'tsconfig.app.json': '{}\n',
      'tsconfig.node.json': '{}\n',
    });

    expect(await exists(join(cwd, 'tsconfig.app.json'))).toBe(false);
    expect(await exists(join(cwd, 'tsconfig.node.json'))).toBe(false);
    expect(notices).toEqual([
      'removed tsconfig.app.json, which nothing references now',
      'removed tsconfig.node.json, which nothing references now',
    ]);
  });

  it('says nothing about a half the generator never wrote', async () => {
    expect(await noticesFor('react', { 'tsconfig.app.json': '{}\n' }))
      .toEqual(['removed tsconfig.app.json, which nothing references now']);
  });

  // Angular's `tsconfig.app.json` and `tsconfig.spec.json` are named by `angular.json`, so they
  // are live configuration rather than orphans.
  it("keeps angular's, which its own build reads", async () => {
    expect(await noticesFor('angular', { 'tsconfig.app.json': '{}\n' })).toEqual([]);
    expect(await exists(join(cwd, 'tsconfig.app.json'))).toBe(true);
  });
});

// Renames the Expo template onto the convention: its files are kebab-case where a `.tsx` here is PascalCase, so `check-
// file` would flag every generated component; renaming closes that rather than adding an exception to the naming map.
describe('starterRenames', () => {
  const read = async (path: string): Promise<string> => {
    return await readFile(join(cwd, path), 'utf8');
  };

  it('moves each file and repoints every specifier that named it', async () => {
    await scaffold({
      'src/components/themed-text.tsx': 'export const ThemedText = 1;\n',
      'src/hooks/use-theme.ts': 'export const useTheme = 1;\n',
      'src/components/hint-row.tsx': [
        "import { ThemedText } from './themed-text';",
        "import { useTheme } from '@/hooks/use-theme';",
        '',
        'export const HintRow = [ThemedText, useTheme];',
        '',
      ].join('\n'),
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await exists(join(cwd, 'src/components/ThemedText.tsx'))).toBe(true);
    expect(await exists(join(cwd, 'src/components/themed-text.tsx'))).toBe(false);
    expect(await read('src/components/HintRow.tsx')).toContain("from './ThemedText'");
    expect(await read('src/components/HintRow.tsx')).toContain("from '@/hooks/useTheme'");
  });

  /**
   * `animated-icon.web.tsx` and `animated-icon.tsx` are separate modules, and a stylesheet keeps its extension where a
   * script drops one, so shortest-first would leave `./AnimatedIcon.web` as `./AnimatedIcon` with a stray `.web`,
   * resolving to the wrong platform variant.
   */
  it('keeps a platform variant and a stylesheet distinct from the module beside them', async () => {
    await scaffold({
      'src/components/animated-icon.tsx': 'export const AnimatedIcon = 1;\n',
      'src/components/animated-icon.module.css': '.icon {\n  color: red;\n}\n',
      'src/components/animated-icon.web.tsx': "import styles from './animated-icon.module.css';\n",
      'src/app/index.tsx': "import { AnimatedIcon } from '@/components/animated-icon';\n",
    });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await exists(join(cwd, 'src/components/AnimatedIcon.web.tsx'))).toBe(true);
    expect(await exists(join(cwd, 'src/components/AnimatedIcon.module.css'))).toBe(true);
    expect(await read('src/components/AnimatedIcon.web.tsx'))
      .toContain("from './AnimatedIcon.module.css'");
    // The route file is not renamed, but a specifier inside it still has to follow.
    expect(await read('src/app/index.tsx')).toContain("from '@/components/AnimatedIcon'");
  });

  // A case-only move, which a case-insensitive filesystem is the hazard for.
  it('renames a file differing from its target only in case', async () => {
    await scaffold({ 'src/components/ui/collapsible.tsx': 'export const Collapsible = 1;\n' });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await exists(join(cwd, 'src/components/ui/Collapsible.tsx'))).toBe(true);
  });

  // expo-router resolves a route by its filename, so renaming one would rename the route.
  it('leaves the route directory alone', async () => {
    await scaffold({ 'src/app/index.tsx': 'export default 1;\n' });

    await repairScaffoldedOutput(cwd, answersFor('react-native'));

    expect(await exists(join(cwd, 'src/app/index.tsx'))).toBe(true);
  });

  it('says so when a rename finds nothing, rather than passing quietly', async () => {
    const notices: string[] = [];

    await scaffold({ 'src/components/themed-text.tsx': 'export const ThemedText = 1;\n' });
    await repairScaffoldedOutput(cwd, answersFor('react-native'), undefined, (message) => {
      notices.push(message);
    });

    expect(notices.some((notice) => {
      return notice.includes('starter rename for src/hooks/use-theme.ts found nothing');
    })).toBe(true);
  });

  it('renames nothing on a target whose generator already names things correctly', async () => {
    await scaffold({ 'src/components/themed-text.tsx': 'export const ThemedText = 1;\n' });

    await repairScaffoldedOutput(cwd, answersFor('react'));

    expect(await exists(join(cwd, 'src/components/themed-text.tsx'))).toBe(true);
  });
});
