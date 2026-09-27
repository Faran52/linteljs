import {
  type ColorSchemeName,
  StyleSheet,
  useColorScheme,
} from 'react-native';

export interface Palette {
  readonly background: string;
  readonly card: string;
  readonly foreground: string;
  readonly muted: string;
  readonly border: string;
  readonly primary: string;
}

export type StarterStyles = ReturnType<typeof sheetsFor>;

// The values of the web targets' `tokens.css`, so a native screen matches them in either scheme.
const PALETTES = {
  light: {
    background: '#faf9f7',
    card: '#fff',
    foreground: '#1c1b19',
    muted: '#6f6b64',
    border: '#e7e3dd',
    primary: '#a8541c',
  },
  dark: {
    background: '#1f2128',
    card: '#262932',
    foreground: '#f0ede7',
    muted: '#8e8a82',
    border: '#32343c',
    primary: '#e8a05c',
  },
} satisfies Record<'light' | 'dark', Palette>;

// Two sheets: `StyleSheet.create` infers one kind for the whole call, so text and view rules would clash.
const sheetsFor = (colors: Palette) => {
  const layout = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 32,
    },
    hero: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    // Named: the navigator types its style as animated, and an inline literal is checked against that union.
    tabBar: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
    },
    header: { backgroundColor: colors.card },
    scene: { backgroundColor: colors.background },
    mark: { gap: 6 },
    beam: {
      width: 96,
      height: 11,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    line: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  });

  const text = StyleSheet.create({
    title: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.foreground,
    },
    lede: {
      fontSize: 15,
      color: colors.muted,
      textAlign: 'center',
    },
    hint: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
      marginTop: 20,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    key: {
      color: colors.foreground,
      fontSize: 13,
    },
    value: {
      color: colors.muted,
      fontSize: 13,
      flexShrink: 1,
      textAlign: 'right',
    },
  });

  return {
    colors,
    layout,
    text,
  };
};

const SHEETS = {
  light: sheetsFor(PALETTES.light),
  dark: sheetsFor(PALETTES.dark),
};

export const stylesFor = (scheme: ColorSchemeName): StarterStyles => {
  return scheme === 'dark' ? SHEETS.dark : SHEETS.light;
};

// Follows the system scheme, as the web targets' `prefers-color-scheme` does.
export const useStarterStyles = (): StarterStyles => {
  return stylesFor(useColorScheme());
};
