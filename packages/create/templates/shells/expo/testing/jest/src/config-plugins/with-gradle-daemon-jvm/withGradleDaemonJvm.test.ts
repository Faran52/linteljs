import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import withGradleDaemonJvm, { daemonJvmProperties } from './withGradleDaemonJvm';

import type { ExpoConfig } from 'expo/config';
import type {
  ExportedConfig,
} from 'expo/config-plugins';

describe('withGradleDaemonJvm', () => {
  it('pins the daemon to JDK 17 with a download for every platform', () => {
    const properties = daemonJvmProperties();
    const expected = [
      'toolchainUrl.LINUX.AARCH64=https://api.adoptium.net/v3/binary/latest/17/ga/linux/aarch64/jdk/hotspot/normal/eclipse',
      'toolchainUrl.LINUX.X86_64=https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse',
      'toolchainUrl.MAC_OS.AARCH64=https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jdk/hotspot/normal/eclipse',
      'toolchainUrl.MAC_OS.X86_64=https://api.adoptium.net/v3/binary/latest/17/ga/mac/x64/jdk/hotspot/normal/eclipse',
      'toolchainUrl.WINDOWS.X86_64=https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse',
      'toolchainVersion=17',
      '',
    ].join('\n');

    expect(properties).toBe(expected);
  });

  it('writes the properties into the android project on prebuild', async () => {
    const prefix = join(tmpdir(), 'gradle-daemon-jvm-');
    const platformProjectRoot = mkdtempSync(prefix);
    const base: ExpoConfig = {
      name: 'app',
      slug: 'app',
    };
    const config: ExportedConfig = withGradleDaemonJvm(base);
    const dangerous = config.mods?.android?.dangerous;
    const modConfig: Parameters<NonNullable<typeof dangerous>>[0] = {
      ...config,
      modResults: null,
      modRequest: {
        projectRoot: platformProjectRoot,
        platformProjectRoot,
        modName: 'dangerous',
        platform: 'android',
        introspect: false,
      },
      modRawConfig: base,
    };

    await dangerous?.(modConfig);

    const written = readFileSync(join(platformProjectRoot, 'gradle/gradle-daemon-jvm.properties'), 'utf8');
    const expected = daemonJvmProperties();

    expect(written).toBe(expected);
  });
});
