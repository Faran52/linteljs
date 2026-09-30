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
    <View style={[layout.screen, layout.hero]}>
      <Text style={text.title}>{code}</Text>
      <Text style={text.lede} accessibilityRole="alert">{message}</Text>
      {onRetry === undefined
        ? null
        : (
            <Pressable
              style={layout.button}
              accessibilityRole="button"
              onPress={onRetry}
            >
              <Text style={text.button}>Try again</Text>
            </Pressable>
          )}
      <Link href="/" style={text.link}>Go home</Link>
    </View>
  );
};
