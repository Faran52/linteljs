import {
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useStarterStyles } from '@styles/starter';

import { useContactForm } from '@hooks/use-contact-form/useContactForm';

import { TextInput } from '@ui';

const ContactScreen = (): ReactNode => {
  const { t } = useTranslation();
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
  } = useContactForm((key) => {
    return t(key);
  });
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
      <Text style={text.pageTitle}>{t('contact')}</Text>
      <Text style={text.lede}>{t('contactLede')}</Text>

      {sent
        ? (
            <Text style={text.sent} role="status">{t('contactSent')}</Text>
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
                <Text style={text.action}>{t('contactSend')}</Text>
              </Pressable>
            </View>
          )}
    </ScrollView>
  );
};

export default ContactScreen;
