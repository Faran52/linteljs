import getPolyfills from '@react-native/js-polyfills/index.js';

import { getDefaultConfig } from 'expo/metro-config.js';
import { withNativewind } from 'nativewind/metro';

/*
 * The two Expo specifiers carry their file: neither package declares an `exports` map or a `main`, so Node
 * resolves a bare one to nothing. NativeWind declares one, so its own specifier is bare.
 *
 * `getPolyfills` is named here because react-native 0.87 deleted `rn-get-polyfills`, which Expo SDK 57 still asks
 * for by path. It was a two-line wrapper over `@react-native/js-polyfills`, which is what this points at instead,
 * as Expo's own source says where it reads the wrapper. Drop this override once the SDK stops asking.
 */
const config = getDefaultConfig(import.meta.dirname);

config.serializer.getPolyfills = getPolyfills;

export default withNativewind(config);
