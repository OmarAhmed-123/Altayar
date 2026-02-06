import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ScrollView,
  FlatList,
  Linking,
  InteractionManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
import { SafeIcon } from './../../utils/iconHelper';
import Toast from 'react-native-toast-message';
import type { ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import { FastImage } from './../../components/common/FastImage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  filename?: string;
}

export const CreateReelScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check Android version for appropriate permissions
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          // Android 13+ (API 33+) - Use granular media permissions
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ];
          
          const results = await PermissionsAndroid.requestMultiple(permissions);
          
          // Check if all permissions are granted
          const allGranted = permissions.every(
            permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED
          );
          
          return allGranted;
        } else {
          // Android 12 and below - Use READ_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'أذونات التخزين',
              message: 'التطبيق يحتاج إلى الوصول إلى الصور والفيديوهات',
              buttonNeutral: 'اسألني لاحقاً',
              buttonNegative: 'إلغاء',
              buttonPositive: 'موافق',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const waitForUIReady = async () => {
    await new Promise<void>(resolve =>
      InteractionManager.runAfterInteractions(() => resolve())
    );
    // Small delay to ensure currentActivity is attached
    await new Promise(resolve => setTimeout(() => resolve(), 50));
  };

  const openAppSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      }
    } catch (settingsError) {
      if (__DEV__) {
        console.error('❌ [CreateReelScreen] Failed to open settings:', settingsError);
      }
    }
  };

  const notifyPermissionDenied = async (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'تنبيه',
      text2: message,
    });
    await openAppSettings();
  };

  const handleImagePicker = (response: ImagePickerResponse) => {
    if (__DEV__) {
      console.log('📸 [CreateReelScreen] handleImagePicker called:', {
        didCancel: response.didCancel,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        assetsCount: response.assets?.length || 0,
      });
    }
    
    if (response.didCancel) {
      if (__DEV__) {
        console.log('📸 [CreateReelScreen] User cancelled selection');
      }
      return;
    } else if (response.errorCode) {
      let errorMessage = `خطأ في اختيار الملفات: ${response.errorMessage || 'خطأ غير معروف'}`;
      
      // Provide specific error messages
      if (response.errorCode === 'permission') {
        errorMessage = 'تم رفض الإذن. يرجى السماح بالوصول إلى الصور والفيديوهات من إعدادات التطبيق';
      } else if (response.errorCode === 'others') {
        errorMessage = 'حدث خطأ أثناء اختيار الملفات. يرجى المحاولة مرة أخرى';
      }
      
      if (__DEV__) {
        console.error('❌ [CreateReelScreen] Image picker error:', {
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
        });
      }
      
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: errorMessage,
      });
      return;
    } else if (response.assets && response.assets.length > 0) {
      if (__DEV__) {
        console.log('📸 [CreateReelScreen] Processing assets:', response.assets.length);
      }
      const newMedia = response.assets
        .map((asset) => {
          if (!asset.uri) {
            return null;
          }
          
          // Ensure URI is properly formatted
          let uri = asset.uri;
          if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
            // Android may return paths without file:// prefix
            uri = `file://${uri}`;
          }
          
          // CRITICAL: Reels only accept videos
          let mediaType: 'image' | 'video' = 'video';
          if (asset.type) {
            if (!asset.type.startsWith('video')) {
              // Reject non-video files
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'الريلز تقبل فيديوهات فقط. يرجى اختيار فيديو.',
              });
              return null;
            }
            mediaType = 'video';
          } else if (asset.uri) {
            // Fallback: check file extension
            const ext = asset.uri.toLowerCase().split('.').pop();
            if (!['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'].includes(ext || '')) {
              // Reject non-video files
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'الريلز تقبل فيديوهات فقط. يرجى اختيار فيديو.',
              });
              return null;
            }
            mediaType = 'video';
          }
          
          return {
            uri: uri,
            type: mediaType,
            filename: asset.fileName || asset.uri?.split('/').pop() || `media-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
          };
        })
        .filter((media): media is SelectedMedia => media !== null);

      if (newMedia.length > 0) {
        setSelectedMedia((prev) => [...prev, ...newMedia]);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: `تم إضافة ${newMedia.length} ملف`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'لم يتم اختيار أي ملفات صالحة',
        });
      }
    } else {
      Toast.show({
        type: 'info',
        text1: 'تنبيه',
        text2: 'لم يتم اختيار أي ملفات',
      });
    }
  };

  const pickImage = async () => {
    try {
      if (__DEV__) {
        console.log('📸 [CreateReelScreen] Starting image picker...');
      }
      
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        if (__DEV__) {
          console.warn('⚠️ [CreateReelScreen] Storage permission denied');
        }
        await notifyPermissionDenied('نحتاج إلى إذن للوصول إلى الفيديوهات. سيتم فتح إعدادات التطبيق الآن للسماح بالأذونات.');
        return;
      }

      if (__DEV__) {
        console.log('✅ [CreateReelScreen] Permission granted, launching image library...');
      }

      await waitForUIReady();

      // CRITICAL: Use try-catch wrapper to handle Activity errors
      try {
        launchImageLibrary(
          {
            mediaType: 'video' as MediaType, // CRITICAL: Only videos for reels
            quality: 0.8,
            selectionLimit: 1, // Only one video per reel
            includeBase64: false, // Don't include base64 to reduce memory usage
            videoQuality: 'high' as any, // High quality for videos
            presentationStyle: 'pageSheet' as any, // Better presentation style
          },
          (response) => {
            if (__DEV__) {
              console.log('📸 [CreateReelScreen] Image picker response:', {
                didCancel: response.didCancel,
                errorCode: response.errorCode,
                errorMessage: response.errorMessage,
                assetsCount: response.assets?.length || 0,
              });
            }
            handleImagePicker(response);
          }
        );
      } catch (launchError: any) {
        if (__DEV__) {
          console.error('❌ [CreateReelScreen] launchImageLibrary error:', launchError);
        }
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'فشل فتح المعرض. يرجى المحاولة مرة أخرى أو إعادة تشغيل التطبيق',
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [CreateReelScreen] pickImage error:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل اختيار الملف. يرجى المحاولة مرة أخرى',
      });
    }
  };

  const takePhoto = async () => {
    try {
      if (__DEV__) {
        console.log('📷 [CreateReelScreen] Starting camera...');
      }
      
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        if (__DEV__) {
          console.warn('⚠️ [CreateReelScreen] Camera permission denied');
        }
        await notifyPermissionDenied('نحتاج إلى إذن للوصول إلى الكاميرا لتسجيل الفيديو. سيتم فتح إعدادات التطبيق الآن للسماح بالأذونات.');
        return;
      }

      if (__DEV__) {
        console.log('✅ [CreateReelScreen] Permission granted, launching camera...');
      }

      await waitForUIReady();

      // CRITICAL: Use try-catch wrapper to handle Activity errors
      try {
        launchCamera(
          {
            mediaType: 'video' as MediaType, // CRITICAL: Only videos for reels
            quality: 0.8,
            saveToPhotos: true,
            includeBase64: false,
            videoQuality: 'high' as any,
            durationLimit: 60, // 60 seconds max for reels
          },
          (response) => {
            if (__DEV__) {
              console.log('📷 [CreateReelScreen] Camera response:', {
                didCancel: response.didCancel,
                errorCode: response.errorCode,
                errorMessage: response.errorMessage,
                assetsCount: response.assets?.length || 0,
              });
            }
            
            if (response.assets && response.assets[0]) {
              handleImagePicker(response);
            } else if (response.didCancel) {
              // User cancelled, do nothing
              if (__DEV__) {
                console.log('📷 [CreateReelScreen] User cancelled camera');
              }
            } else if (response.errorCode) {
              handleImagePicker(response);
            }
          }
        );
      } catch (launchError: any) {
        if (__DEV__) {
          console.error('❌ [CreateReelScreen] launchCamera error:', launchError);
        }
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'فشل فتح الكاميرا. يرجى المحاولة مرة أخرى أو إعادة تشغيل التطبيق',
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [CreateReelScreen] takePhoto error:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل التقاط الفيديو. يرجى المحاولة مرة أخرى',
      });
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const createFormData = (media: SelectedMedia): FormData => {
    const formData = new FormData();
    
    // CRITICAL: Reels only accept videos
    if (media.type !== 'video') {
      throw new Error('الريلز تقبل فيديوهات فقط');
    }
    
    const filename = media.filename || media.uri.split('/').pop() || `reel-${Date.now()}.mp4`;
    
    // CRITICAL: Only video mime types for reels
    let mimeType = 'video/mp4';
    if (filename.endsWith('.mp4')) mimeType = 'video/mp4';
    else if (filename.endsWith('.mov')) mimeType = 'video/quicktime';
    else if (filename.endsWith('.webm')) mimeType = 'video/webm';
    else if (filename.endsWith('.avi')) mimeType = 'video/x-msvideo';
    else if (filename.endsWith('.3gp')) mimeType = 'video/3gpp';
    else mimeType = 'video/mp4';

    // Handle URI properly for both Android and iOS
    let fileUri = media.uri;
    
    // For Android, keep file:// prefix
    // For iOS, remove file:// prefix if present
    if (Platform.OS === 'ios' && fileUri.startsWith('file://')) {
      fileUri = fileUri.replace('file://', '');
    } else if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
      // Android may need file:// prefix for some cases
      fileUri = `file://${fileUri}`;
    }
    
    formData.append('media', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('mediaType', media.type);
    formData.append('isReel', 'true');
    formData.append('category', 'reels');

    return formData;
  };

  const handleNext = () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى إدخال عنوان للريل',
      });
      return;
    }

    if (!content.trim()) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى إدخال محتوى للريل',
      });
      return;
    }

    if (selectedMedia.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار فيديو على الأقل',
      });
      return;
    }
    
    // CRITICAL: Validate that all selected media are videos
    const nonVideoFiles = selectedMedia.filter(media => media.type !== 'video');
    if (nonVideoFiles.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'الريلز تقبل فيديوهات فقط. يرجى إزالة الملفات غير الفيديو.',
      });
      return;
    }

    setShowReview(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setIsUploading(true);

      // CRITICAL: Upload all selected media in ONE reel (multiple images/videos in single reel)
      try {
        const response = await API.blog.createBlogWithMultipleFiles(
          selectedMedia,
          title.trim(),
          content.trim(),
          (progressEvent) => {
            // Upload progress tracking
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              if (__DEV__ && percentCompleted % 25 === 0) {
                console.log(`[Upload] Progress: ${percentCompleted}%`);
              }
            }
          }
        );
        
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: `تم إنشاء ريل بنجاح مع ${selectedMedia.length} ${selectedMedia.length === 1 ? 'ملف' : 'ملفات'}`,
        });
        
        // Navigate back after a short delay to ensure backend has processed
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } catch (error: any) {
        console.error('Error uploading media:', error);
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: error.message || 'فشل رفع الملفات',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل إنشاء الريل',
      });
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
      setShowReview(false);
    }
  };

  // Review Screen
  if (showReview) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={() => setShowReview(false)} style={styles.backButton}>
            <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>مراجعة قبل النشر</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.reviewContent}>
          <View style={styles.reviewSection}>
            <Text style={[styles.reviewLabel, { color: theme.colors.text }]}>العنوان:</Text>
            <Text style={[styles.reviewValue, { color: theme.colors.text }]}>{title}</Text>
          </View>

          <View style={styles.reviewSection}>
            <Text style={[styles.reviewLabel, { color: theme.colors.text }]}>المحتوى:</Text>
            <Text style={[styles.reviewValue, { color: theme.colors.text }]}>{content}</Text>
          </View>

          <View style={styles.reviewSection}>
            <Text style={[styles.reviewLabel, { color: theme.colors.text }]}>
              الملفات المختارة ({selectedMedia.length}):
            </Text>
            <FlatList
              data={selectedMedia}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.mediaReviewItem}>
                  {/* CRITICAL: Reels only show videos */}
                  {item.type === 'video' ? (
                    <View style={[styles.mediaReviewPlaceholder, { backgroundColor: theme.colors.surface }]}>
                      <SafeIcon name="videocam" size={40} color={theme.colors.primary} />
                      <Text style={[styles.videoLabel, { color: theme.colors.textSecondary }]}>فيديو</Text>
                      <Text style={[styles.videoLabel, { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 }]}>
                        {item.filename || 'فيديو'}
                      </Text>
                    </View>
                  ) : (
                    // This shouldn't happen for reels, but show placeholder
                    <View style={[styles.mediaReviewPlaceholder, { backgroundColor: theme.colors.error }]}>
                      <SafeIcon name="error" size={40} color="#FFFFFF" />
                      <Text style={[styles.videoLabel, { color: '#FFFFFF', fontSize: 10 }]}>ملف غير صالح</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeReviewButton}
                    onPress={() => removeMedia(index)}
                  >
                    <SafeIcon name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </ScrollView>

        <View style={[styles.reviewActions, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.textSecondary }]}
            onPress={() => setShowReview(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.publishButtonText}>نشر الآن</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إنشاء ريل جديد</Text>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isSubmitting || isUploading}
          style={[
            styles.nextButton,
            { backgroundColor: isSubmitting || isUploading ? theme.colors.textSecondary : theme.colors.primary }
          ]}
        >
          <Text style={styles.nextButtonText}>التالي</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.mediaSection}>
          {selectedMedia.length > 0 ? (
            <View>
              <FlatList
                data={selectedMedia}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.mediaPreview}>
                    {/* CRITICAL: Reels only accept videos - always show video placeholder */}
                    <View style={[styles.mediaPlaceholder, { backgroundColor: theme.colors.surface }]}>
                      <SafeIcon name="videocam" size={40} color={theme.colors.primary} />
                      <Text style={[styles.videoLabel, { color: theme.colors.textSecondary }]}>فيديو</Text>
                      {item.filename && (
                        <Text style={[styles.videoLabel, { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 }]}>
                          {item.filename.length > 20 ? item.filename.substring(0, 20) + '...' : item.filename}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                    >
                      <SafeIcon name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              />
              <View style={styles.mediaButtons}>
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: theme.colors.primary }]}
                  onPress={pickImage}
                >
                  <SafeIcon name="photo-library" size={20} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>إضافة من المعرض</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: theme.colors.primary }]}
                  onPress={takePhoto}
                >
                  <SafeIcon name="camera-alt" size={20} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>التقاط</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.mediaPlaceholderContainer}>
              <TouchableOpacity
                style={[styles.mediaButton, { backgroundColor: theme.colors.primary }]}
                onPress={pickImage}
              >
                <SafeIcon name="photo-library" size={20} color="#FFFFFF" />
                <Text style={styles.mediaButtonText}>من المعرض</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mediaButton, { backgroundColor: theme.colors.primary }]}
                onPress={takePhoto}
              >
                <SafeIcon name="camera-alt" size={20} color="#FFFFFF" />
                <Text style={styles.mediaButtonText}>التقاط</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>العنوان *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="أدخل عنوان الريل"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>المحتوى *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              value={content}
              onChangeText={setContent}
              placeholder="أدخل محتوى الريل"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {content.length}/500
            </Text>
          </View>
        </View>

        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.uploadingText, { color: theme.colors.text }]}>
              جاري الرفع...
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  nextButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  mediaSection: {
    marginBottom: 12,
  },
  mediaPreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    flex: 1,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 44,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 80,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  uploadingText: {
    fontSize: 12,
  },
  // Review Screen Styles
  reviewContent: {
    flex: 1,
    padding: 16,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaReviewItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  mediaReviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaReviewPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  removeReviewButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
