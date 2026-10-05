import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type ConfigPlugin, withDangerousMod } from 'expo/config-plugins';

// React Native builds on JDK 17. On 24 and later, Prefab's JNA prints a restricted-method warning that fails every
// CMake configure, so Gradle runs on 17 whatever `JAVA_HOME` is, and downloads one where none is installed.
const JDK_URL = 'https://api.adoptium.net/v3/binary/latest/17/ga';

// Gradle's platform key, then Adoptium's.
const PLATFORMS: Record<string, string> = {
  'LINUX.AARCH64': 'linux/aarch64',
  'LINUX.X86_64': 'linux/x64',
  'MAC_OS.AARCH64': 'mac/aarch64',
  'MAC_OS.X86_64': 'mac/x64',
  'WINDOWS.X86_64': 'windows/x64',
};

export const daemonJvmProperties = (): string => {
  const urls = Object.entries(PLATFORMS)
    .map(([platform, path]) => {
      return `toolchainUrl.${platform}=${JDK_URL}/${path}/jdk/hotspot/normal/eclipse`;
    });
  const lines = [
    ...urls,
    'toolchainVersion=17',
    '',
  ];

  return lines.join('\n');
};

const withGradleDaemonJvm: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    (modConfig) => {
      const directory = join(modConfig.modRequest.platformProjectRoot, 'gradle');

      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'gradle-daemon-jvm.properties'), daemonJvmProperties());

      return Promise.resolve(modConfig);
    },
  ]);
};

export default withGradleDaemonJvm;
