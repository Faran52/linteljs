// iOS designates Chinese by script, so a region code would match no device language.
export const IOS_LOCALES: Readonly<Record<string, string>> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
};

// A starter file, so Gradle's daemon JDK survives every `expo prebuild`.
export const GRADLE_DAEMON_JVM_PLUGIN = './src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.ts';
