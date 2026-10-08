import {
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ANSWERS, STACK } from '@config/linteljs';
import { useStarterStyles } from '@styles/starterStyles';

import type { ReactNode } from 'react';

// Recorded when the project was generated: a device cannot read that machine.
const VersionScreen = (): ReactNode => {
  const { layout, text } = useStarterStyles();

  return (
    // Focusable, so a keyboard can scroll what overflows on the web.
    <ScrollView
      style={layout.screen}
      contentContainerStyle={layout.page}
      role="main"
      tabIndex={0}
    >
      <Text style={text.pageTitle}>Version</Text>
      <Text style={text.lede}>What this project is running, and the answers it was generated from.</Text>

      <Text style={text.sectionTitle}>Stack</Text>
      {STACK
        .map((entry) => {
          return (
            <View key={entry.name} style={layout.row}>
              <Text style={text.key}>{entry.name}</Text>
              <Text style={text.value}>{entry.version}</Text>
            </View>
          );
        })}

      <Text style={text.sectionTitle}>Your answers</Text>
      {ANSWERS
        .map((entry) => {
          return (
            <View key={entry.label} style={layout.row}>
              <Text style={text.key}>{entry.label}</Text>
              <Text style={text.value}>{entry.value}</Text>
            </View>
          );
        })}
    </ScrollView>
  );
};

export default VersionScreen;
