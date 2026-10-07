import {
  Text,
  TextInput as NativeTextInput,
  View,
} from 'react-native';

import { useStarterStyles } from '@styles/starterStyles';

import type { FC } from 'react';

// The web input's props, so the shared contact hooks bind either.
export interface TextInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly error: string | undefined;
  readonly multiline?: boolean;
  readonly type?: 'text' | 'email';
}

export const TextInput: FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  multiline = false,
  type = 'text',
}) => {
  const { layout, text } = useStarterStyles();
  const invalid = error !== undefined;
  const email = type === 'email';
  const inputStyle = [
    layout.input,
    multiline && layout.textarea,
    invalid && layout.inputInvalid,
  ];

  return (
    <View style={layout.field}>
      {/* A screen reader hears these words as the input's own label. */}
      <Text style={text.label} aria-hidden>{label}</Text>
      <NativeTextInput
        id={id}
        style={inputStyle}
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        multiline={multiline}
        keyboardType={email ? 'email-address' : 'default'}
        autoCapitalize={email ? 'none' : 'sentences'}
        autoComplete={email ? 'email' : 'off'}
        onChangeText={onChange}
        onBlur={onBlur}
      />
      {invalid ? <Text style={text.error} aria-live="polite">{error}</Text> : null}
    </View>
  );
};
