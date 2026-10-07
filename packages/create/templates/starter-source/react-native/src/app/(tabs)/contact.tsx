import {
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useStarterStyles } from '@styles/starter';

import { CONTACT_TEXT, type Translate } from '@services/contact-form/contactFormService';

import { useContactForm } from '@hooks/use-contact-form/useContactForm';

import { TextInput } from '@ui';

const inEnglish: Translate = (key) => {
  return CONTACT_TEXT[key];
};

const ContactScreen = (): ReactNode => {
  const { layout, text } = useStarterStyles();
  const scrollRef = useRef<ScrollView>(null);

  // A focused field scrolls only its caret into view, and Send sits below the message field.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const {
    fields,
    sent,
    submitting,
    canSubmit,
    onSubmit,
  } = useContactForm(inEnglish);
  const disabled = !canSubmit || submitting;
  const actionStyle = [layout.action, disabled && layout.actionDisabled];

  return (
    // iOS insets the scroll by the keyboard it overlaps; Android resizes the window instead.
    <ScrollView
      ref={scrollRef}
      style={layout.screen}
      role="main"
      tabIndex={0}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Text style={text.pageTitle}>Contact</Text>
      <Text style={text.lede}>Two fields, validated on blur. Nothing is sent anywhere.</Text>

      {sent
        ? (
            <Text style={text.sent} role="status">Thanks. Nothing was sent, this is a starter.</Text>
          )
        : (
            <View style={layout.form}>
              <TextInput {...fields.email} />
              <TextInput {...fields.message} />
              <Pressable
                style={actionStyle}
                role="button"
                disabled={disabled}
                onPress={onSubmit}
              >
                <Text style={text.action}>Send</Text>
              </Pressable>
            </View>
          )}
    </ScrollView>
  );
};

export default ContactScreen;
