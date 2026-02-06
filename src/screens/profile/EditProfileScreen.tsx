import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuthStore } from './../../stores/authStore';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SafeIcon } from './../../utils/iconHelper';
import { getFallbackAvatarUri, resolveUserAvatarUri } from '../../utils/avatarHelper';
import { buildProfilePictureUrl } from '../../utils/imageUrlBuilder';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUser, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const fallbackAvatarUri = useMemo(
    () => getFallbackAvatarUri(user, theme.colors.primary),
    [user?.name, user?.firstName, user?.lastName, theme.colors.primary]
  );
  const displayAvatarUri = avatarUri || resolveUserAvatarUri(user?.avatar, fallbackAvatarUri);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      // Build full URL for avatar if it exists
      const avatarUrl = user.avatar ? buildProfilePictureUrl(user.avatar) || user.avatar : null;
      setAvatarUri(avatarUrl);
    }
  }, [user]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'أذونات الكاميرا',
            message: 'التطبيق يحتاج إلى الوصول إلى الكاميرا لالتقاط الصور',
            buttonNeutral: 'اسألني لاحقاً',
            buttonNegative: 'إلغاء',
            buttonPositive: 'موافق',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    } else if (response.errorCode) {
      Alert.alert('خطأ', `خطأ في اختيار الصورة: ${response.errorMessage}`);
      return;
    } else if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      if (asset.uri) {
        setAvatarUri(asset.uri);
      }
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('خطأ', 'يجب السماح بالوصول إلى الكاميرا');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        saveToPhotos: true,
      },
      handleImagePicker
    );
  };

  const handlePickFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
      },
      handleImagePicker
    );
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'تغيير الصورة',
      'اختر طريقة رفع الصورة',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'الكاميرا', 
          onPress: handleTakePhoto,
        },
        { 
          text: 'المعرض', 
          onPress: handlePickFromGallery,
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // Prepare data for update
      const updateData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // If avatar was selected, include it in the update
      // Only send local file URI (not already uploaded URL)
      const imageToUpload = avatarUri && avatarUri.startsWith('file://') ? avatarUri : undefined;
      await updateUser(updateData, imageToUpload);
      
      // Wait a bit to ensure state is updated and image is processed
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Reload user data to get updated profile picture URL
      const { loadUser } = useAuthStore.getState();
      await loadUser();
      
      Alert.alert('نجح', 'تم تحديث الملف الشخصي بنجاح! سيتم تحديث البيانات في جميع أنحاء التطبيق.', [
        { text: 'موافق', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Better error handling
      let errorMessage = 'فشل في تحديث الملف الشخصي';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'خطأ في السيرفر. يرجى المحاولة مرة أخرى';
      } else if (error.response?.status === 400) {
        errorMessage = 'بيانات غير صحيحة. يرجى التحقق من المدخلات';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت';
      }
      
      Alert.alert('خطأ', errorMessage);
    }
  };

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
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    content: {
      padding: theme.spacing.lg,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    changeAvatarButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    changeAvatarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    required: {
      color: theme.colors.error,
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
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  // Don't block the UI with loading spinner - show it inline if needed

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
          <Text style={styles.title}>تعديل الملف الشخصي</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {displayAvatarUri ? (
                <Image
                  source={{ uri: displayAvatarUri }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => {
                    setAvatarUri(fallbackAvatarUri);
                  }}
                />
              ) : (
                <SafeIcon name="person" size={50} color={theme.colors.primary} />
              )}
            </View>
            <TouchableOpacity 
              style={styles.changeAvatarButton}
              onPress={handleChangeAvatar}
            >
              <Text style={styles.changeAvatarText}>تغيير الصورة</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                الاسم الأول <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="أدخل اسمك الأول"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                الاسم الأخير <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="أدخل اسمك الأخير"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                البريد الإلكتروني <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="أدخل بريدك الإلكتروني"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="أدخل رقم هاتفك"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات إضافية</Text>
            <Text style={styles.infoText}>
              يمكنك تحديث معلوماتك الشخصية في أي وقت. تأكد من أن جميع المعلومات صحيحة ومحدثة.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};