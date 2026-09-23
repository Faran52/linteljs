import { Text, View } from 'react-native';

import { Mark } from '../components/ui/mark/Mark';
import { NAME } from '../config/linteljs';
import { layout, text } from '../styles/starter';

import type { ReactNode } from 'react';

const HomeScreen = (): ReactNode => {
  return (
    <View style={[layout.screen, layout.hero]}>
      <Mark />
      <Text style={text.title}>{NAME}</Text>
      <Text style={text.lede}>Expo, expo-router and the standard already applied.</Text>
      <Text style={text.hint}>Run pnpm check for lint, types, tests and build.</Text>
    </View>
  );
};

export default HomeScreen;
