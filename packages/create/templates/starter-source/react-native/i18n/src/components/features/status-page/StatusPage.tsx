import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import { useStarterStyles } from '@styles/starter';

import type { ReactNode } from 'react';

interface StatusPageProps {
  readonly code: number;
  // A key into `src/i18n/locales/`, as `STATUSES` holds it.
  readonly message: string;
  readonly onRetry?: () => void;
}

export const StatusPage = ({
  code,
  message,
  onRetry,
}: StatusPageProps): ReactNode => {
  const { t } = useTranslation();
  const { layout, text } = useStarterStyles();
  const homeLinkStyle = onRetry === undefined
    ? [layout.action, text.action]
    : [
        layout.action,
        layout.actionOutline,
        text.action,
        text.actionOutline,
      ];

  return (
    <View style={layout.status}>
      <Text style={text.statusCode}>{code}</Text>
      <Text style={text.statusMessage} accessibilityRole="alert">{t(message)}</Text>
      <View style={layout.actions}>
        {onRetry === undefined
          ? null
          : (
              <Pressable
                style={layout.action}
                accessibilityRole="button"
                onPress={onRetry}
              >
                <Text style={text.action}>{t('statusRetry')}</Text>
              </Pressable>
            )}
        <Link
          href="/"
          style={homeLinkStyle}
        >
          {t('statusHome')}
        </Link>
      </View>
    </View>
  );
};
