import { Text, View } from 'react-native';

import { CHECK, NAME } from '@config/linteljs';
import { useStarterStyles } from '@styles/starter';

import { Mark } from '@ui/mark/Mark';

import type { ReactNode } from 'react';

const HomeScreen = (): ReactNode => {
  const { layout, text } = useStarterStyles();

  return (
    <View style={[layout.screen, layout.hero]}>
      <Mark />
      <Text style={text.title}>{NAME}</Text>
      <Text style={text.lede}>Expo, expo-router and the standard already applied.</Text>
      <Text style={text.hint}>
        Run
        {' '}
        {CHECK}
        {' '}
        for the full gate.
      </Text>
    </View>
  );
};

export default HomeScreen;
