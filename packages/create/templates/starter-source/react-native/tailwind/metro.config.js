import { getDefaultConfig } from 'expo/metro-config.js';
import { withNativewind } from 'nativewind/metro';

// Expo's specifier carries its file: the package declares no `exports` map, so Node resolves a bare one to nothing.
export default withNativewind(getDefaultConfig(import.meta.dirname));
