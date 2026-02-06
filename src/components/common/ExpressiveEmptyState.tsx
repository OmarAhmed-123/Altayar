import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { getEmptyStateImage } from './../../services/expressiveImageService';
import { ensureStringUri, getDefaultFallbackImage } from './../../utils/imageUriHelper';
import { FastImage } from './FastImage';
import { SafeIcon } from './../../utils/iconHelper';

interface ExpressiveEmptyStateProps {
  title: string;
  message?: string;
  imageCategory?: string;
  imageUrl?: string;
  showAnimation?: boolean;
  size?: number;
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
}

export const ExpressiveEmptyState: React.FC<ExpressiveEmptyStateProps> = ({
  title,
  message,
  imageCategory = 'empty',
  imageUrl,
  showAnimation = true,
  size = 300,
  iconName,
  iconColor,
  iconSize = 64,
}) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      try {
        if (imageUrl) {
          setImageUri(imageUrl);
        } else {
          const url = await getEmptyStateImage(imageCategory, size);
          setImageUri(url);
        }
      } catch (error) {
        console.error('Error loading empty state image:', error);
        // Final fallback
        const searchTerm = imageCategory.replace(/\+/g, ' ');
        setImageUri(`https://source.unsplash.com/${size}x${size}/?${encodeURIComponent(searchTerm)}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [imageUrl, imageCategory, size]);

  useEffect(() => {
    if (showAnimation && !isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAnimation, isLoading, fadeAnim, scaleAnim]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    imageContainer: {
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.surface,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {(() => {
          const safeUri = ensureStringUri(
            imageUri,
            `https://source.unsplash.com/${size}x${size}/?${encodeURIComponent(imageCategory)}`,
          );
          if (!safeUri || isLoading) {
            return (
              <View style={styles.placeholder}>
                {iconName ? (
                  <SafeIcon name={iconName} size={iconSize} color={iconColor || theme.colors.primary} />
                ) : (
                  <Text style={{ color: theme.colors.textSecondary }}>...</Text>
                )}
              </View>
            );
          }

          return (
            <FastImage
              source={safeUri}
              style={styles.image}
              resizeMode="cover"
              onError={() => {
                // Fallback on error
                setImageUri(`https://source.unsplash.com/${size}x${size}/?${encodeURIComponent(imageCategory)}`);
              }}
              fallback={getDefaultFallbackImage()}
            />
          );
        })()}
      </Animated.View>
      <Animated.View
        style={{
          opacity: fadeAnim,
        }}
      >
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </Animated.View>
    </View>
  );
};

