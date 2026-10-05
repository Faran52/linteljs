import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ANSWERS, STACK } from '@config/linteljs';
import { useStarterStyles } from '@styles/starter';

import type { ReactNode } from 'react';

// Recorded when the project was generated: a device cannot read that machine.
const VersionScreen = (): ReactNode => {
  const { t } = useTranslation();
  const { layout, text } = useStarterStyles();

  return (
    // Focusable, so a keyboard can scroll what overflows on the web.
    <ScrollView
      style={layout.screen}
      role="main"
      tabIndex={0}
    >
      <Text style={text.pageTitle}>{t('version')}</Text>
      <Text style={text.lede}>{t('versionLede')}</Text>

      <Text style={text.sectionTitle}>{t('versionStack')}</Text>
      {STACK
        .map((entry) => {
          return (
            <View key={entry.name} style={layout.row}>
              <Text style={text.key}>{entry.name}</Text>
              <Text style={text.value}>{entry.version}</Text>
            </View>
          );
        })}

      <Text style={text.sectionTitle}>{t('versionAnswers')}</Text>
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
