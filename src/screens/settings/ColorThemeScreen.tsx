import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { SafeIcon } from './../../utils/iconHelper';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isDark: boolean;
}

export const ColorThemeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [selectedTheme, setSelectedTheme] = useState(isDarkMode ? 'dark' : 'light');

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      name: 'المظهر الفاتح',
      description: 'مظهر فاتح مناسب للاستخدام في النهار',
      colors: {
        primary: '#6366F1',
        secondary: '#EC4899',
        accent: '#F59E0B',
      },
      isDark: false,
    },
    {
      id: 'dark',
      name: 'المظهر الداكن',
      description: 'مظهر داكن مناسب للاستخدام في الليل',
      colors: {
        primary: '#818CF8',
        secondary: '#F472B6',
        accent: '#FBBF24',
      },
      isDark: true,
    },
    {
      id: 'auto',
      name: 'تلقائي',
      description: 'يتغير تلقائياً حسب إعدادات النظام',
      colors: {
        primary: '#6366F1',
        secondary: '#EC4899',
        accent: '#F59E0B',
      },
      isDark: false,
    },
  ];

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    
    if (themeId === 'auto') {
      // Handle auto theme - this would typically use system theme
      Alert.alert('معلومة', 'سيتم تطبيق المظهر التلقائي عند إعادة تشغيل التطبيق');
    } else {
      const isDark = themeId === 'dark';
      if (isDark !== isDarkMode) {
        toggleTheme();
      }
    }
  };

  const renderThemeOption = ({ item, index }: { item: ThemeOption; index: number }) => (
    <AnimatedCard
      style={[
        styles.themeOption,
        selectedTheme === item.id && styles.selectedTheme,
      ].filter(Boolean) as any}
      animationType="slide"
      delay={index * 100}
      onPress={() => handleThemeSelect(item.id)}
    >
      <View style={styles.themeContent}>
        <View style={styles.themePreview}>
          <View style={[styles.colorPreview, { backgroundColor: item.colors.primary }]} />
          <View style={[styles.colorPreview, { backgroundColor: item.colors.secondary }]} />
          <View style={[styles.colorPreview, { backgroundColor: item.colors.accent }]} />
        </View>
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{item.name}</Text>
          <Text style={styles.themeDescription}>{item.description}</Text>
        </View>
        <View style={styles.themeSelector}>
          {selectedTheme === item.id && (
            <SafeIcon name="check-circle" size={24} color={theme.colors.primary} />
          )}
        </View>
      </View>
    </AnimatedCard>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    themeOption: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedTheme: {
      borderColor: theme.colors.primary,
    },
    themeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    themePreview: {
      flexDirection: 'row',
      marginRight: theme.spacing.md,
    },
    colorPreview: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: theme.spacing.xs,
    },
    themeInfo: {
      flex: 1,
    },
    themeName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    themeDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    themeSelector: {
      marginLeft: theme.spacing.md,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>مظهر التطبيق</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>اختر المظهر</Text>
            <Text style={styles.sectionDescription}>
              اختر المظهر الذي يناسبك. يمكنك تغييره في أي وقت.
            </Text>
            
            {themeOptions.map((option, index) => (
              <View key={option.id}>
                {renderThemeOption({ item: option, index })}
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>نصائح</Text>
            <Text style={styles.infoText}>
              • المظهر الفاتح مناسب للاستخدام في الأماكن المضيئة{'\n'}
              • المظهر الداكن يوفر راحة أكبر للعين في الأماكن المظلمة{'\n'}
              • المظهر التلقائي يتغير حسب إعدادات جهازك
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};