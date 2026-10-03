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
  readonly primaryForeground: string;
}

export type StarterStyles = ReturnType<typeof sheetsFor>;

// The values of the web targets' `tokens.css`, so a native screen matches them in either scheme.
const PALETTES = {
  light: {
    background: '#faf9f7',
    card: '#fff',
    foreground: '#1c1b19',
    muted: '#63605a',
    border: '#e7e3dd',
    primary: '#a8541c',
    primaryForeground: '#fff',
  },
  dark: {
    background: '#1f2128',
    card: '#262932',
    foreground: '#f0ede7',
    muted: '#aca9a1',
    border: '#32343c',
    primary: '#e8a05c',
    primaryForeground: '#241505',
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
    // The web status page's measures: 38 high, `--radius-md`, 12 apart.
    status: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginTop: 24,
    },
    action: {
      height: 38,
      justifyContent: 'center',
      paddingHorizontal: 15,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: colors.primary,
    },
    actionOutline: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
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
    // 36 is the action's height inside its border, so a link's label sits centred as a button's does.
    action: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 36,
    },
    statusCode: {
      fontSize: 56,
      fontWeight: '700',
      lineHeight: 56,
      letterSpacing: -1.7,
      color: colors.foreground,
    },
    statusMessage: {
      marginTop: 14,
      fontSize: 18,
      color: colors.muted,
      textAlign: 'center',
    },
    actionOutline: { color: colors.foreground },
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

  const styles = {
    colors,
    layout,
    text,
  };

  return styles;
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
  const scheme = useColorScheme();

  return stylesFor(scheme);
};
