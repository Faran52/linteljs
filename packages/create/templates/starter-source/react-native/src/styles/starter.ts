import { StyleSheet } from 'react-native';

/*
 * The starter's own styles, as a `StyleSheet` rather than the stylesheet every other target ships: React Native has
 * no CSS and no cascade, so a token is a value in this file and a rule is an object. The names match the classes
 * used everywhere else, which is what keeps the two readable side by side.
 *
 * Two sheets, not one: `StyleSheet.create` infers one kind for the whole call, so a text rule and a view rule in
 * the same object leave every entry typed as whichever it settled on.
 */
export const colors = {
  background: '#0b0d0e',
  card: '#14181a',
  foreground: '#e8edf0',
  muted: '#8b989f',
  border: '#232a2e',
  primary: '#4db6a5',
};

export const layout = StyleSheet.create({
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
  // Named here rather than written inline: the navigator types its own style as an animated one, and an object
  // literal handed straight to it is checked against that union instead of against a view.
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
  },
  scene: { backgroundColor: colors.background },
  mark: { gap: 6 },
  beam: {
    width: 96,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.foreground,
  },
  line: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export const text = StyleSheet.create({
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
