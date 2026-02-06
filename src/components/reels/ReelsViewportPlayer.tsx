import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeVideoPlayer } from '../common/SafeVideoPlayer';

interface ReelsViewportPlayerProps {
  uri?: string | null;
  playing: boolean;
  muted: boolean;
  onLoad?: (data: any) => void;
  onReadyForDisplay?: (data: any) => void;
  onError?: (error: any) => void;
  onProgress?: (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => void;
  onEnd?: () => void;
}

export const ReelsViewportPlayer: React.FC<ReelsViewportPlayerProps> = ({
  uri,
  playing,
  muted,
  onLoad,
  onReadyForDisplay,
  onError,
  onProgress,
  onEnd,
}) => {
  if (!uri) {
    return <View style={styles.placeholder} pointerEvents="none" />;
  }
  return (
    <View style={styles.container} pointerEvents="none">
      <SafeVideoPlayer
        source={{ uri }}
        style={styles.video}
        resizeMode="cover"
        controls={false}
        paused={!playing}
        repeat={true}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        muted={muted}
        volume={1.0}
        poster={undefined}
        requiresAuth={true}
        onLoad={onLoad}
        onReadyForDisplay={onReadyForDisplay}
        onError={onError}
        onProgress={onProgress}
        onEnd={onEnd}
        fallbackMessage={Platform.OS === 'android' ? 'تشغيل عبر WebView' : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});


