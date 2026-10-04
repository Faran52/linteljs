import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useStarterStyles } from '@styles/starter';

import { chooseLanguage } from '@i18n';
import { languages } from '@i18n/config';

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
  const currentLabelStyle = { color: colors.foreground };
  const menuStyle = [styles.menu, { backgroundColor: colors.card }];

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
        <Text style={currentLabelStyle} numberOfLines={1}>{current?.label}</Text>
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
            style={menuStyle}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('language')}
          >
            {languages
              .map(({ id, label }) => {
                const isChosen = id === i18n.language;
                const optionState = { checked: isChosen };
                const optionLabelStyle = { color: isChosen ? colors.primary : colors.foreground };

                return (
                  <Pressable
                    key={id}
                    style={styles.option}
                    accessibilityRole="radio"
                    accessibilityState={optionState}
                    onPress={() => {
                      setOpen(false);
                      void chooseLanguage(id);
                    }}
                  >
                    <Text style={optionLabelStyle}>{label}</Text>
                  </Pressable>
                );
              })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
