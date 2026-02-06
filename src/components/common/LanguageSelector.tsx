import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useLanguage } from './../../hooks/useLanguage';
import { useTheme } from './../../hooks/useTheme';
import { getIconImageUrl } from './../../utils/imageUtils';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const [iconImage, setIconImage] = useState<string | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const url = await getIconImageUrl('language', 20, 20);
        setIconImage(url);
      } catch (error) {
        console.error('Error loading language icon:', error);
      }
    };
    loadIcon();
  }, []);

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
    icon: {
      width: 20,
      height: 20,
      marginRight: theme.spacing.xs,
    },
    text: {
      fontSize: 14,
      color: theme.colors.text,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      {iconImage ? (
        <Image source={{ uri: iconImage }} style={styles.icon} resizeMode="contain" />
      ) : (
        <Text style={styles.text}>🌐</Text>
      )}
      <Text style={styles.text}>{language === 'ar' ? 'EN' : 'عربي'}</Text>
    </TouchableOpacity>
  );
};
