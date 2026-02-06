/**
 * FastImage Component Wrapper
 * Provides a unified interface for both local and remote images
 * Uses react-native-fast-image for remote images and regular Image for local images
 */
import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import FastImageLib, { ImageStyle as FastImageStyle } from 'react-native-fast-image';
import { ensureStringUri, getDefaultFallbackImage } from './../../utils/imageUriHelper';
import { buildImageUrl } from './../../utils/imageUrlBuilder';

interface FastImageProps {
  source: string | number | ImageSourcePropType | { uri: string };
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  onError?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  fallback?: ImageSourcePropType;
}

export const FastImage: React.FC<FastImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  onError,
  onLoadStart,
  onLoadEnd,
  fallback,
}) => {
  // Handle local images (require() returns a number)
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={style as StyleProp<ImageStyle>}
        resizeMode={resizeMode}
        onError={onError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );
  }

  // Handle object with uri property
  let uri: string = '';
  if (typeof source === 'object' && source !== null && 'uri' in source) {
    const rawUri = ensureStringUri(source.uri, '');
    uri = buildImageUrl(rawUri) || rawUri;
  } else if (typeof source === 'string') {
    const rawUri = ensureStringUri(source, '');
    uri = buildImageUrl(rawUri) || rawUri;
  }

  // If no valid URI, use fallback
  if (!uri || uri.trim() === '') {
    const fallbackSource = fallback || getDefaultFallbackImage();
    return (
      <Image
        source={fallbackSource}
        style={style as StyleProp<ImageStyle>}
        resizeMode={resizeMode}
        onError={onError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );
  }

  // Check if it's a local file URI (file:// or content://)
  // FastImage doesn't support local file URIs well, use regular Image instead
  const isLocalFile = uri.startsWith('file://') || uri.startsWith('content://');
  
  if (isLocalFile) {
    // Use regular Image for local files
    return (
      <Image
        source={{ uri: uri }}
        style={style as StyleProp<ImageStyle>}
        resizeMode={resizeMode}
        onError={onError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );
  }

  // Map resizeMode to FastImage format
  const fastImageResizeMode = 
    resizeMode === 'contain' ? FastImageLib.resizeMode.contain :
    resizeMode === 'stretch' ? FastImageLib.resizeMode.stretch :
    resizeMode === 'center' ? FastImageLib.resizeMode.center :
    FastImageLib.resizeMode.cover;

  // Use FastImage for remote images (http/https)
  return (
    <FastImageLib
      source={{
        uri: uri,
        priority: FastImageLib.priority.normal,
        cache: FastImageLib.cacheControl.immutable,
      }}
      style={style as StyleProp<FastImageStyle>}
      resizeMode={fastImageResizeMode}
      onError={onError}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      defaultSource={fallback || getDefaultFallbackImage()}
    />
  );
};

