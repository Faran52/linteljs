import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { chooseLanguage } from '@i18n';
import { languages } from '@i18n/config';

import { useStarterStyles } from '@/styles/starter';

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menu: {
    minWidth: 220,
    paddingVertical: 8,
    borderRadius: 7,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});

// React Native has no select, so the header's control opens the list in a modal.
export const LanguageSelect = (): ReactNode => {
  const { t, i18n } = useTranslation();
  const { colors } = useStarterStyles();
  const [open, setOpen] = useState(false);
  const current = languages
    .find(({ id }) => {
      return id === i18n.language;
    });

  return (
    <>
      <Pressable
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t('language')}
        onPress={() => {
          setOpen(true);
        }}
      >
        <Text style={{ color: colors.foreground }}>{current?.label}</Text>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => {
          setOpen(false);
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setOpen(false);
          }}
        >
          <View
            style={[styles.menu, { backgroundColor: colors.card }]}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('language')}
          >
            {languages
              .map(({ id, label }) => {
                return (
                  <Pressable
                    key={id}
                    style={styles.option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: id === i18n.language }}
                    onPress={() => {
                      setOpen(false);
                      void chooseLanguage(id);
                    }}
                  >
                    <Text style={{ color: id === i18n.language ? colors.primary : colors.foreground }}>{label}</Text>
                  </Pressable>
                );
              })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
