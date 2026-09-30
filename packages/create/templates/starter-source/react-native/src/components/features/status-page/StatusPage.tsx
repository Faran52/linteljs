import {
  Pressable,
  Text,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import { useStarterStyles } from '../../../styles/starter';

import type { ReactNode } from 'react';

interface StatusPageProps {
  readonly code: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

export const StatusPage = ({
  code,
  message,
  onRetry,
}: StatusPageProps): ReactNode => {
  const { layout, text } = useStarterStyles();

  return (
    <View style={layout.status}>
      <Text style={text.statusCode}>{code}</Text>
      <Text style={text.statusMessage} accessibilityRole="alert">{message}</Text>
      <View style={layout.actions}>
        {onRetry === undefined
          ? null
          : (
              <Pressable
                style={layout.action}
                accessibilityRole="button"
                onPress={onRetry}
              >
                <Text style={text.action}>Try again</Text>
              </Pressable>
            )}
        <Link
          href="/"
          style={onRetry === undefined
            ? [layout.action, text.action]
            : [
                layout.action,
                layout.actionOutline,
                text.action,
                text.actionOutline,
              ]}
        >
          Go home
        </Link>
      </View>
    </View>
  );
};
