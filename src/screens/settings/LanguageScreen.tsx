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

interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

export const LanguageScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const languageOptions: LanguageOption[] = [
    {
      id: 'ar',
      name: 'العربية',
      nativeName: 'العربية',
      flag: 'language', // Icon name instead of emoji
      isRTL: true,
    },
    {
      id: 'en',
      name: 'English',
      nativeName: 'English',
      flag: 'language', // Icon name instead of emoji
      isRTL: false,
    },
    {
      id: 'fr',
      name: 'Français',
      nativeName: 'Français',
      flag: 'language',
      isRTL: false,
    },
    {
      id: 'es',
      name: 'Español',
      nativeName: 'Español',
      flag: 'language',
      isRTL: false,
    },
    {
      id: 'de',
      name: 'Deutsch',
      nativeName: 'Deutsch',
      flag: 'language',
      isRTL: false,
    },
    {
      id: 'it',
      name: 'Italiano',
      nativeName: 'Italiano',
      flag: 'language',
      isRTL: false,
    },
  ];

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
    setLanguage(languageId);
    
    Alert.alert(
      'تم تغيير اللغة',
      'تم تغيير لغة التطبيق بنجاح. قد تحتاج إلى إعادة تشغيل التطبيق لرؤية التغييرات.',
      [{ text: 'موافق' }]
    );
  };

  const renderLanguageOption = ({ item, index }: { item: LanguageOption; index: number }) => (
    <AnimatedCard
      style={[
        styles.languageOption,
        selectedLanguage === item.id && styles.selectedLanguage,
      ].filter(Boolean) as any}
      animationType="slide"
      delay={index * 100}
      onPress={() => handleLanguageSelect(item.id)}
    >
      <View style={styles.languageContent}>
        <View style={styles.languageLeft}>
          <View style={styles.flagIconContainer}>
            <SafeIcon name={item.flag} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{item.name}</Text>
            <Text style={styles.languageNativeName}>{item.nativeName}</Text>
          </View>
        </View>
        <View style={styles.languageRight}>
          {selectedLanguage === item.id && (
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
    languageOption: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedLanguage: {
      borderColor: theme.colors.primary,
    },
    languageContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
    },
    languageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    flagIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    flag: {
      fontSize: 24,
      marginRight: theme.spacing.md,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    languageNativeName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    languageRight: {
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
    currentLanguage: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    currentLanguageText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
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
          <Text style={styles.title}>لغة التطبيق</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.currentLanguage}>
            <Text style={styles.currentLanguageText}>
              اللغة الحالية: {languageOptions.find(lang => lang.id === selectedLanguage)?.name}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>اختر اللغة</Text>
            <Text style={styles.sectionDescription}>
              اختر اللغة التي تريد استخدامها في التطبيق.
            </Text>
            
            {languageOptions.map((option, index) => (
              <View key={option.id}>
                {renderLanguageOption({ item: option, index })}
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>معلومة</Text>
            <Text style={styles.infoText}>
              • سيتم تطبيق اللغة المختارة على جميع أجزاء التطبيق{'\n'}
              • قد تحتاج إلى إعادة تشغيل التطبيق لرؤية التغييرات{'\n'}
              • يمكنك تغيير اللغة في أي وقت من هذه الصفحة
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};