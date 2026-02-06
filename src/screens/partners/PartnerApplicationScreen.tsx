import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { partnerService } from '../../services/partnerService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const PartnerApplicationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    businessType: '',
    services: '',
  });

  const businessTypes = [
    'hotel',
    'restaurant',
    'tour_operator',
    'transportation',
    'entertainment',
    'shopping',
    'spa',
    'other',
  ];

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.businessType) {
      Alert.alert(t('error'), t('please_fill_all_required_fields'));
      return;
    }

    setLoading(true);
    try {
      const services = formData.services.split(',').map(s => s.trim()).filter(s => s);
      const response = await partnerService.applyToBePartner({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || undefined,
        address: formData.address || undefined,
        businessType: formData.businessType,
        services: services.length > 0 ? services : undefined,
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('partner_application_submitted_successfully'),
        });
        // Reset form
        setFormData({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          businessType: '',
          services: '',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_submit_application'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <SafeIcon name="business" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{t('become_a_partner')}</Text>
          <Text style={styles.headerSubtitle}>{t('join_our_partner_network')}</Text>
        </View>

        <View style={[styles.form, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('company_name')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              placeholder={t('enter_company_name')}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('contact_person')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.contactPerson}
              onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
              placeholder={t('enter_contact_person_name')}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('email')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder={t('enter_email')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('phone')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder={t('enter_phone_number')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {t('business_type')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <View style={styles.businessTypeContainer}>
              {businessTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.businessTypeButton,
                    {
                      backgroundColor: formData.businessType === type ? theme.colors.primary : theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, businessType: type })}
                >
                  <Text
                    style={[
                      styles.businessTypeText,
                      { color: formData.businessType === type ? '#FFFFFF' : theme.colors.text },
                    ]}
                  >
                    {t(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('website')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder={t('enter_website_url')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('address')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder={t('enter_address')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('services')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formData.services}
              onChangeText={(text) => setFormData({ ...formData, services: text })}
              placeholder={t('enter_services_comma_separated')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <>
                <SafeIcon name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>{t('submit_application')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  form: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  businessTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  businessTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

