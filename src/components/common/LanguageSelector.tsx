import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const styles = StyleSheet.create({
    button: {
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.xs,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      <Icon name="language" size={20} color={theme.colors.primary} />
      <Text style={styles.text}>{language === 'ar' ? 'EN' : 'عربي'}</Text>
    </TouchableOpacity>
  );
};
