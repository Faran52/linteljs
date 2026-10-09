import {
  type ReactNode,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useStarterStyles } from '@styles/starter.styles';

import { CONTACT_COPY } from '@services/contact-form/constants';
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
      contentContainerStyle={layout.page}
      role="main"
      tabIndex={0}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Text style={text.pageTitle}>Contact</Text>
      <Text style={text.lede}>{CONTACT_COPY.lede}</Text>

      {sent
        ? (
            <Text style={text.sent} role="status">{CONTACT_COPY.sent}</Text>
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

const unsubscribe = (): void => {
  // The answer never changes after mount.
};

const subscribe = (): (() => void) => {
  return unsubscribe;
};

// Client only: a static web render would build the form, whose devtools retry timer holds `expo export` open.
const ContactRoute = (): ReactNode => {
  const client = useSyncExternalStore(subscribe, () => {
    return true;
  }, () => {
    return false;
  });

  return client ? <ContactScreen /> : null;
};

export default ContactRoute;
