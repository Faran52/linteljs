import { Trans, useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CHECK, NAME } from '@config/linteljs';
import { useStarterStyles } from '@styles/starterStyles';

import { Mark } from '@ui/mark/Mark';

import type { ReactNode } from 'react';

const CODE = { code: <Text /> };
const CHECK_VALUES = { command: CHECK };

const HomeScreen = (): ReactNode => {
  const { t } = useTranslation();
  const { layout, text } = useStarterStyles();
  const heroStyle = [layout.screen, layout.hero];

  return (
    <View style={heroStyle} role="main">
      <Mark />
      <Text style={text.title}>{NAME}</Text>
      <Text style={text.lede}>{t('homeLedeExpo')}</Text>
      <Text style={text.hint}>
        <Trans
          i18nKey="gateHint"
          values={CHECK_VALUES}
          components={CODE}
          t={t}
        />
      </Text>
    </View>
  );
};

export default HomeScreen;
