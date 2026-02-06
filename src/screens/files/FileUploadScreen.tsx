import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { fileManagementAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';
// Note: For production, install and use:
// npm install expo-image-picker expo-document-picker
// import * as ImagePicker from 'expo-image-picker';
// import * as DocumentPicker from 'expo-document-picker';

export const FileUploadScreen: React.FC = () => {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handlePickImage = async () => {
    // TODO: Implement with expo-image-picker
    // For now, show a message
    Alert.alert(
      'رفع الصورة',
      'لرفع الصور، يرجى تثبيت مكتبة expo-image-picker:\nnpm install expo-image-picker'
    );
    // Placeholder - in production, use ImagePicker
    // const hasPermission = await requestPermissions();
    // if (!hasPermission) return;
    // const result = await ImagePicker.launchImageLibraryAsync({...});
  };

  const handleTakePhoto = async () => {
    // TODO: Implement with expo-image-picker
    Alert.alert(
      'التقاط صورة',
      'للتقاط الصور، يرجى تثبيت مكتبة expo-image-picker:\nnpm install expo-image-picker'
    );
  };

  const handlePickDocument = async () => {
    // TODO: Implement with expo-document-picker
    Alert.alert(
      'اختيار مستند',
      'لاختيار المستندات، يرجى تثبيت مكتبة expo-document-picker:\nnpm install expo-document-picker'
    );
  };

  const handleUpload = async () => {
    if (!selectedImage && !selectedDocument) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار ملف للرفع',
      });
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
        formData.append('fileType', 'image');
      } else if (selectedDocument) {
        formData.append('file', {
          uri: selectedDocument.uri,
          name: selectedDocument.name,
          type: selectedDocument.mimeType || 'application/octet-stream',
        } as any);
        formData.append('fileType', 'document');
      }

      await fileManagementAPI.uploadCustomFile(formData as any);
      
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم رفع الملف بنجاح',
      });

      // Reset selection
      setSelectedImage(null);
      setSelectedDocument(null);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل رفع الملف',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>رفع ملف</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            اختر ملفاً لرفعه إلى حسابك
          </Text>
        </View>

        {/* Image Upload Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>رفع صورة</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setSelectedImage(null)}
              >
                <SafeIcon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
                onPress={handlePickImage}
              >
                <SafeIcon name="photo-library" size={24} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>اختر من المعرض</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.colors.secondary }]}
                onPress={handleTakePhoto}
              >
                <SafeIcon name="camera-alt" size={24} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>التقط صورة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Document Upload Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>رفع مستند</Text>
          
          {selectedDocument ? (
            <View style={styles.documentPreview}>
              <SafeIcon name="description" size={48} color={theme.colors.primary} />
              <Text style={[styles.documentName, { color: theme.colors.text }]} numberOfLines={1}>
                {selectedDocument.name}
              </Text>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setSelectedDocument(null)}
              >
                <SafeIcon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              onPress={handlePickDocument}
            >
              <SafeIcon name="attach-file" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>اختر مستند</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Button */}
        {(selectedImage || selectedDocument) && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <SafeIcon name="cloud-upload" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>رفع الملف</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
          <SafeIcon name="info" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            يمكنك رفع الصور والمستندات. الحد الأقصى لحجم الملف هو 10 ميجابايت.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  documentPreview: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  documentName: {
    fontSize: 14,
    marginTop: 8,
    maxWidth: '80%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

