import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';

import { GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';
import { useStarterStyles } from '@styles/starter';

import type { ReactNode } from 'react';

const AboutScreen = (): ReactNode => {
  const { t } = useTranslation();
  const { layout, text } = useStarterStyles();

  return (
    // Focusable, so a keyboard can scroll what overflows on the web.
    <ScrollView
      style={layout.screen}
      role="main"
      tabIndex={0}
    >
      <Text style={text.pageTitle}>{t('about')}</Text>
      <Text style={text.lede}>{t('aboutLede')}</Text>

      <Text style={text.sectionTitle}>{t('aboutGate')}</Text>
      {GATE
        .map((leg) => {
          return (
            <View key={leg.command} style={layout.row}>
              <Text style={text.key}>{leg.command}</Text>
              <Text style={text.value}>{leg.runs}</Text>
            </View>
          );
        })}

      <Text style={text.sectionTitle}>{t('aboutStandard')}</Text>
      {STANDARD_PATHS
        .map((entry) => {
          return (
            <View key={entry.path} style={layout.row}>
              <Text style={text.key}>{entry.path}</Text>
              <Text style={text.value}>{t(entry.holds)}</Text>
            </View>
          );
        })}
    </ScrollView>
  );
};

export default AboutScreen;
