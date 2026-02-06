/**
 * ImagePreviewScreen
 * Screen to preview images and videos in full screen
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { SafeIcon } from '../../utils/iconHelper';
import { useTheme } from '../../hooks/useTheme';
import { SafeVideoPlayer } from '../../components/common/SafeVideoPlayer';

// CRITICAL: Use SafeVideoPlayer instead of directly importing Video
// This prevents "Cannot read property 'getViewManagerConfig' of null" errors

export const ImagePreviewScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { imageUrl, title } = route.params as { imageUrl: string; title?: string };
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Determine if it's a video or image
  const isVideo = imageUrl?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
  
  const handleClose = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar hidden />
      
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <SafeIcon name="close" size={30} color={theme.colors.text} />
      </TouchableOpacity>
      
      {/* Media Container */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <SafeVideoPlayer
            source={{ uri: imageUrl }}
            style={styles.video}
            resizeMode="contain"
            controls={true}
            paused={false}
            onLoad={() => setIsLoading(false)}
            onError={(error) => {
              console.error('Video error:', error);
              setError(true);
              setIsLoading(false);
            }}
            repeat={true}
            fallbackMessage="مشغل الفيديو غير متاح"
          />
        ) : (
          <FastImage
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError(true);
              setIsLoading(false);
            }}
          />
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <SafeIcon name="alert-circle" size={48} color={theme.colors.error} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

