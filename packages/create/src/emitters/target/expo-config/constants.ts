// iOS designates Chinese by script, so a region code would match no device language.
export const IOS_LOCALES: Readonly<Record<string, string>> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
};

// A starter file, so Gradle's daemon JDK survives every `expo prebuild`.
export const GRADLE_DAEMON_JVM_PLUGIN = './src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.ts';

// The starter's `assets/images/`, on the backgrounds of its `src/styles/starter.ts`.
const LIGHT_BACKGROUND = '#faf9f7';

const DARK_BACKGROUND = '#1f2128';

export const ICON = './assets/images/icon.png';

export const IOS_ICON = {
  light: ICON,
  dark: './assets/images/icon-dark.png',
};

export const ADAPTIVE_ICON = {
  foregroundImage: './assets/images/adaptive-foreground.png',
  backgroundColor: LIGHT_BACKGROUND,
};

export const SPLASH_SCREEN = {
  image: './assets/images/splash.png',
  imageWidth: 200,
  backgroundColor: LIGHT_BACKGROUND,
  dark: {
    image: './assets/images/splash-dark.png',
    backgroundColor: DARK_BACKGROUND,
  },
};
